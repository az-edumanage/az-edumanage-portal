import { Component, DestroyRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { TenantTeachersFacade } from '../../state/tenant-teachers.facade';
import { Teacher } from '../../models/tenant-teachers.models';

@Component({
  selector: 'app-tenant-teachers',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-teachers.component.html'})
export class TenantTeachersComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TenantTeachersFacade);

  readonly searchQuery = this.facade.searchQuery;
  readonly showFilterPanel = this.facade.showFilterPanel;
  readonly viewMode = this.facade.viewMode;
  readonly teachers = this.facade.teachers;
  readonly activeSettingsId = this.facade.activeSettingsId;
  readonly activeChatTeacher = this.facade.activeChatTeacher;
  readonly activeFiltersCount = this.facade.activeFiltersCount;
  readonly filteredTeachers = this.facade.filteredTeachers;

  readonly filterForm = this.fb.group({
    subject: [''],
    status: [''],
    sortBy: ['name'],
  });

  constructor() {
    this.filterForm.valueChanges
      .pipe(startWith(this.filterForm.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.facade.setFilters(value.subject ?? '', value.status ?? '', value.sortBy ?? 'name');
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
      subject: '',
      status: '',
      sortBy: 'name',
    });
  }

  toggleSettings(event: Event, id: string): void {
    event.stopPropagation();
    this.facade.toggleSettings(id);
  }

  @HostListener('document:click')
  closeSettings(): void {
    this.facade.closeSettings();
  }

  openChat(teacher: Teacher): void {
    this.facade.openChat(teacher);
  }

  updateStatus(id: string, status: 'Active' | 'Inactive'): void {
    this.facade.updateStatus(id, status);
  }
}
