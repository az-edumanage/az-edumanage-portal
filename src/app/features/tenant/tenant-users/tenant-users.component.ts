import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { TenantUsersFacade } from '../state/tenant-users.facade';

@Component({
  selector: 'app-tenant-users',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-users.component.html',
  styleUrl: './tenant-users.component.css'})
export class TenantUsersComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TenantUsersFacade);

  readonly activeTab = this.facade.activeTab;
  readonly searchQuery = this.facade.searchQuery;
  readonly showFilterPanel = this.facade.showFilterPanel;
  readonly users = this.facade.users;
  readonly pendingRequests = this.facade.pendingRequests;
  readonly activeFiltersCount = this.facade.activeFiltersCount;
  readonly filteredUsers = this.facade.filteredUsers;

  readonly filterForm = this.fb.group({
    role: [''],
    status: [''],
    sortBy: ['name'],
  });

  constructor() {
    this.filterForm.valueChanges
      .pipe(startWith(this.filterForm.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.facade.setFilters(value.role ?? '', value.status ?? '', value.sortBy ?? 'name');
      });
  }

  toggleFilterPanel(): void {
    this.facade.toggleFilterPanel();
  }

  clearAllFilters(): void {
    this.facade.clearAllFilters();
    this.clearAdvancedFilters();
  }

  clearAdvancedFilters(): void {
    this.facade.clearAdvancedFilters();
    this.filterForm.reset({
      role: '',
      status: '',
      sortBy: 'name',
    });
  }
}
