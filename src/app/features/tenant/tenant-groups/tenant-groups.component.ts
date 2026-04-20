import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';

interface Group {
  id: string;
  name: string;
  teacher: string;
  subject: string;
  studentsCount: number;
  schedule: string;
  room: string;
}

@Component({
  selector: 'app-tenant-groups',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-groups.component.html'})
export class TenantGroupsComponent {
  private fb = inject(FormBuilder);

  searchQuery = signal('');
  showFilterPanel = signal(false);
  viewMode = signal<'grid' | 'list'>('grid');
  
  filterForm = this.fb.group({
    subject: [''],
    teacher: [''],
    sortBy: ['name']
  });

  // Convert form value changes to a signal for reactivity in computed signals
  filterValues = toSignal(
    this.filterForm.valueChanges.pipe(startWith(this.filterForm.value)),
    { initialValue: this.filterForm.value }
  );

  groups = signal<Group[]>([
    { id: '1', name: 'Physics G12-A', teacher: 'Dr. Ahmed Zewail', subject: 'Physics', studentsCount: 24, schedule: 'Mon, Wed 10:00 AM', room: 'Lab 101' },
    { id: '2', name: 'Math Advanced', teacher: 'Prof. Mona Helmy', subject: 'Mathematics', studentsCount: 18, schedule: 'Tue, Thu 02:00 PM', room: 'Room 204' },
    { id: '3', name: 'Organic Chem', teacher: 'Mr. Khaled Said', subject: 'Chemistry', studentsCount: 15, schedule: 'Sun, Tue 09:00 AM', room: 'Lab 102' },
    { id: '4', name: 'Biology Intro', teacher: 'Ms. Fatma Ali', subject: 'Biology', studentsCount: 30, schedule: 'Mon, Thu 12:00 PM', room: 'Room 301' },
  ]);

  activeFiltersCount = computed(() => {
    let count = 0;
    const values = this.filterValues();
    if (values.subject) count++;
    if (values.teacher) count++;
    if (values.sortBy !== 'name') count++;
    return count;
  });

  filteredGroups = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const filters = this.filterValues();
    
    const result = this.groups().filter(group => {
      const matchesSearch = !query || 
        group.name.toLowerCase().includes(query) || 
        group.subject.toLowerCase().includes(query) ||
        group.teacher.toLowerCase().includes(query) ||
        group.room.toLowerCase().includes(query);
      
      const matchesSubject = !filters.subject || group.subject === filters.subject;
      const matchesTeacher = !filters.teacher || group.teacher === filters.teacher;

      return matchesSearch && matchesSubject && matchesTeacher;
    });

    // Sorting
    if (filters.sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === 'students-desc') {
      result.sort((a, b) => b.studentsCount - a.studentsCount);
    } else if (filters.sortBy === 'students-asc') {
      result.sort((a, b) => a.studentsCount - b.studentsCount);
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
      subject: '',
      teacher: '',
      sortBy: 'name'
    });
  }
}
