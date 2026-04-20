import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';

interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Staff' | 'Teacher';
  status: 'Active' | 'Inactive' | 'Pending';
  lastLogin: string;
  avatar?: string;
}

interface PendingRequest {
  id: string;
  name: string;
  email: string;
  requestedRole: string;
  date: string;
}

@Component({
  selector: 'app-tenant-users',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-users.component.html',
  styleUrl: './tenant-users.component.css'})
export class TenantUsersComponent {
  private fb = inject(FormBuilder);

  activeTab = signal<'users' | 'pending'>('users');
  searchQuery = signal('');
  showFilterPanel = signal(false);
  
  filterForm = this.fb.group({
    role: [''],
    status: [''],
    sortBy: ['name']
  });

  filterValues = toSignal(
    this.filterForm.valueChanges.pipe(startWith(this.filterForm.value)),
    { initialValue: this.filterForm.value }
  );

  users = signal<TenantUser[]>([
    { id: '1', name: 'Ahmed Admin', email: 'admin@school.com', role: 'Admin', status: 'Active', lastLogin: '2 hours ago' },
    { id: '2', name: 'Sara Manager', email: 'sara.m@school.com', role: 'Manager', status: 'Active', lastLogin: '1 day ago' },
    { id: '3', name: 'John Staff', email: 'john.s@school.com', role: 'Staff', status: 'Inactive', lastLogin: '3 days ago' },
    { id: '4', name: 'Dr. Ahmed Zewail', email: 'zewail@school.com', role: 'Teacher', status: 'Active', lastLogin: '1 hour ago' },
    { id: '5', name: 'Mona Helmy', email: 'mona.h@school.com', role: 'Teacher', status: 'Pending', lastLogin: 'Never' },
  ]);

  pendingRequests = signal<PendingRequest[]>([
    { id: '1', name: 'Youssef Mansour', email: 'youssef@example.com', requestedRole: 'Teacher', date: 'Feb 24, 2026' },
    { id: '2', name: 'Layla Ibrahim', email: 'layla@example.com', requestedRole: 'Staff', date: 'Feb 23, 2026' },
  ]);

  activeFiltersCount = computed(() => {
    let count = 0;
    const values = this.filterValues();
    if (values.role) count++;
    if (values.status) count++;
    if (values.sortBy !== 'name') count++;
    return count;
  });

  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const filters = this.filterValues();
    
    const result = this.users().filter(user => {
      const matchesSearch = !query || 
        user.name.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query);
      
      const matchesRole = !filters.role || user.role === filters.role;
      const matchesStatus = !filters.status || user.status === filters.status;

      return matchesSearch && matchesRole && matchesStatus;
    });

    // Sorting
    if (filters.sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === 'lastLogin') {
      // Simple mock sort for last login
      result.sort((a, b) => a.lastLogin.localeCompare(b.lastLogin));
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
      role: '',
      status: '',
      sortBy: 'name'
    });
  }
}
