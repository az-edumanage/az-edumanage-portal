import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';

interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  status: 'Active' | 'Inactive' | 'Pending';
  enrollmentDate: string;
}

@Component({
  selector: 'app-tenant-students',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-students.component.html'})
export class TenantStudentsComponent {
  private fb = inject(FormBuilder);

  searchQuery = signal('');
  showFilterPanel = signal(false);
  viewMode = signal<'grid' | 'list'>('list');
  
  filterForm = this.fb.group({
    grade: [''],
    status: [''],
    sortBy: ['name']
  });

  // Convert form value changes to a signal for reactivity in computed signals
  filterValues = toSignal(
    this.filterForm.valueChanges.pipe(startWith(this.filterForm.value)),
    { initialValue: this.filterForm.value }
  );

  students = signal<Student[]>([
    { id: '1', name: 'Ahmed Ali', email: 'ahmed@example.com', grade: 'Grade 12', status: 'Active', enrollmentDate: 'Sep 2023' },
    { id: '2', name: 'Sara Mohamed', email: 'sara@example.com', grade: 'Grade 11', status: 'Active', enrollmentDate: 'Oct 2023' },
    { id: '3', name: 'Omar Hassan', email: 'omar@example.com', grade: 'Grade 12', status: 'Inactive', enrollmentDate: 'Aug 2023' },
    { id: '4', name: 'Laila Mahmoud', email: 'laila@example.com', grade: 'Grade 10', status: 'Active', enrollmentDate: 'Jan 2024' },
  ]);

  activeFiltersCount = computed(() => {
    let count = 0;
    const values = this.filterValues();
    if (values.grade) count++;
    if (values.status) count++;
    if (values.sortBy !== 'name') count++;
    return count;
  });

  filteredStudents = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const filters = this.filterValues();
    
    const result = this.students().filter(student => {
      const matchesSearch = !query || 
        student.name.toLowerCase().includes(query) || 
        student.email.toLowerCase().includes(query);
      
      const matchesGrade = !filters.grade || student.grade === filters.grade;
      const matchesStatus = !filters.status || student.status === filters.status;

      return matchesSearch && matchesGrade && matchesStatus;
    });

    // Sorting
    if (filters.sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === 'date-desc') {
      result.sort((a, b) => new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime());
    } else if (filters.sortBy === 'date-asc') {
      result.sort((a, b) => new Date(a.enrollmentDate).getTime() - new Date(b.enrollmentDate).getTime());
    }

    return result;
  });

  toggleFilterPanel() {
    this.showFilterPanel.update(v => !v);
  }

  clearAllFilters() {
    this.searchQuery.set('');
    this.clearAdvancedFilters();
  }

  clearAdvancedFilters() {
    this.filterForm.reset({
      grade: '',
      status: '',
      sortBy: 'name'
    });
  }
}
