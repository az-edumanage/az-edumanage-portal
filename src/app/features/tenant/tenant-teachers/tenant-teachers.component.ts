import { Component, signal, HostListener, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';

interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  joinDate: string;
}

@Component({
  selector: 'app-tenant-teachers',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-teachers.component.html'})
export class TenantTeachersComponent {
  private fb = inject(FormBuilder);

  searchQuery = signal('');
  showFilterPanel = signal(false);
  viewMode = signal<'grid' | 'list'>('grid');
  
  filterForm = this.fb.group({
    subject: [''],
    status: [''],
    sortBy: ['name']
  });

  // Convert form value changes to a signal for reactivity in computed signals
  filterValues = toSignal(
    this.filterForm.valueChanges.pipe(startWith(this.filterForm.value)),
    { initialValue: this.filterForm.value }
  );

  teachers = signal<Teacher[]>([
    { id: '1', name: 'Dr. Ahmed Zewail', email: 'zewail@center.edu', subject: 'Physics', status: 'Active', joinDate: 'Jan 2022' },
    { id: '2', name: 'Prof. Mona Helmy', email: 'mona@center.edu', subject: 'Mathematics', status: 'Active', joinDate: 'Mar 2022' },
    { id: '3', name: 'Mr. Khaled Said', email: 'khaled@center.edu', subject: 'Chemistry', status: 'On Leave', joinDate: 'Jun 2022' },
    { id: '4', name: 'Ms. Fatma Ali', email: 'fatma@center.edu', subject: 'Biology', status: 'Active', joinDate: 'Sep 2022' },
  ]);

  activeSettingsId = signal<string | null>(null);
  activeChatTeacher = signal<Teacher | null>(null);

  activeFiltersCount = computed(() => {
    let count = 0;
    const values = this.filterValues();
    if (values.subject) count++;
    if (values.status) count++;
    if (values.sortBy !== 'name') count++;
    return count;
  });

  filteredTeachers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const filters = this.filterValues();
    
    const result = this.teachers().filter(teacher => {
      const matchesSearch = !query || 
        teacher.name.toLowerCase().includes(query) || 
        teacher.subject.toLowerCase().includes(query) ||
        teacher.email.toLowerCase().includes(query);
      
      const matchesSubject = !filters.subject || teacher.subject === filters.subject;
      const matchesStatus = !filters.status || teacher.status === filters.status;

      return matchesSearch && matchesSubject && matchesStatus;
    });

    // Sorting
    if (filters.sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === 'date-desc') {
      result.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
    } else if (filters.sortBy === 'date-asc') {
      result.sort((a, b) => new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime());
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
      status: '',
      sortBy: 'name'
    });
  }

  toggleSettings(event: Event, id: string) {
    event.stopPropagation();
    if (this.activeSettingsId() === id) {
      this.activeSettingsId.set(null);
    } else {
      this.activeSettingsId.set(id);
    }
  }

  @HostListener('document:click')
  closeSettings() {
    this.activeSettingsId.set(null);
  }

  openChat(teacher: Teacher) {
    this.activeChatTeacher.set(teacher);
  }

  updateStatus(id: string, status: 'Active' | 'Inactive') {
    this.teachers.update(list => 
      list.map(t => t.id === id ? { ...t, status } : t)
    );
    this.activeSettingsId.set(null);
  }
}

