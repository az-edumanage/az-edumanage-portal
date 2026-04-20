import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';

interface Grade {
  id: string;
  name: string;
  level: string;
  studentCount: number;
  description: string;
}

@Component({
  selector: 'app-tenant-grades',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-grades.component.html'})
export class TenantGradesComponent {
  private fb = inject(FormBuilder);

  searchQuery = signal('');
  showFilterPanel = signal(false);
  viewMode = signal<'grid' | 'list'>('grid');
  
  filterForm = this.fb.group({
    level: [''],
    minStudents: [null as number | null],
    maxStudents: [null as number | null],
    sortBy: ['name']
  });

  // Convert form value changes to a signal for reactivity in computed signals
  filterValues = toSignal(
    this.filterForm.valueChanges.pipe(startWith(this.filterForm.value)),
    { initialValue: this.filterForm.value }
  );

  grades = signal<Grade[]>([
    { id: '1', name: 'Grade 10', level: 'Secondary', studentCount: 120, description: 'First year of secondary education.' },
    { id: '2', name: 'Grade 11', level: 'Secondary', studentCount: 110, description: 'Second year of secondary education.' },
    { id: '3', name: 'Grade 12', level: 'Secondary', studentCount: 95, description: 'Final year of secondary education.' },
    { id: '4', name: 'Primary 1', level: 'Primary', studentCount: 80, description: 'First year of primary education.' },
    { id: '5', name: 'Primary 2', level: 'Primary', studentCount: 85, description: 'Second year of primary education.' },
  ]);

  activeFiltersCount = computed(() => {
    let count = 0;
    const values = this.filterValues();
    if (values.level) count++;
    if (values.minStudents !== null && values.minStudents !== undefined) count++;
    if (values.maxStudents !== null && values.maxStudents !== undefined) count++;
    if (values.sortBy !== 'name') count++;
    return count;
  });

  filteredGrades = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const filters = this.filterValues();
    
    const result = this.grades().filter(grade => {
      const matchesSearch = !query || 
        grade.name.toLowerCase().includes(query) || 
        grade.level.toLowerCase().includes(query);
      
      const matchesLevel = !filters.level || grade.level === filters.level;
      
      const matchesMin = filters.minStudents === null || filters.minStudents === undefined || 
        grade.studentCount >= (filters.minStudents ?? 0);
        
      const matchesMax = filters.maxStudents === null || filters.maxStudents === undefined || 
        grade.studentCount <= (filters.maxStudents ?? 9999);

      return matchesSearch && matchesLevel && matchesMin && matchesMax;
    });

    // Sorting
    if (filters.sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === 'students-desc') {
      result.sort((a, b) => b.studentCount - a.studentCount);
    } else if (filters.sortBy === 'students-asc') {
      result.sort((a, b) => a.studentCount - b.studentCount);
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
      level: '',
      minStudents: null,
      maxStudents: null,
      sortBy: 'name'
    });
  }
}
