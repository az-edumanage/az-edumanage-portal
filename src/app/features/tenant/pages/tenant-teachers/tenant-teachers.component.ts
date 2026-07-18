import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { TenantTeachersFacade } from '../../state/tenant-teachers.facade';
import { Teacher } from '../../models/tenant-teachers.models';

@Component({
  selector: 'app-tenant-teachers',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-teachers.component.html',
  styleUrl: './tenant-teachers.component.css',
  host: {
    '(document:click)': 'closeSettings()',
    '(document:keydown.escape)': 'closeCapacityDialog()',
  },
})
export class TenantTeachersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TenantTeachersFacade);
  private readonly router = inject(Router);

  readonly searchQuery = this.facade.searchQuery;
  readonly showFilterPanel = this.facade.showFilterPanel;
  readonly viewMode = this.facade.viewMode;
  readonly teachers = this.facade.teachers;
  readonly isLoading = this.facade.isLoading;
  readonly errorMessage = this.facade.errorMessage;
  readonly statusSummary = this.facade.statusSummary;
  readonly isStatusSummaryLoading = this.facade.isStatusSummaryLoading;
  readonly statusSummaryError = this.facade.statusSummaryError;
  readonly teacherStatusFilter = this.facade.teacherStatusFilter;
  readonly capacity = this.facade.capacity;
  readonly isCapacityLoading = this.facade.isCapacityLoading;
  readonly hasStatusFilter = this.facade.hasStatusFilter;
  readonly subjectOptions = this.facade.subjectOptions;
  readonly activeSettingsId = this.facade.activeSettingsId;
  readonly activeChatTeacher = this.facade.activeChatTeacher;
  readonly activeFiltersCount = this.facade.activeFiltersCount;
  readonly filteredTeachers = this.facade.filteredTeachers;
  readonly pagedTeachers = this.facade.pagedTeachers;
  readonly totalFilteredTeachers = this.facade.totalFilteredTeachers;
  readonly totalPages = this.facade.totalPages;
  readonly pageIndex = this.facade.pageIndex;
  readonly pageSize = this.facade.pageSize;
  readonly pageStart = this.facade.pageStart;
  readonly pageEnd = this.facade.pageEnd;
  readonly activeStatusEmptyMessage = this.facade.activeStatusEmptyMessage;
  readonly passwordModalTeacher = this.facade.passwordModalTeacher;
  readonly passwordSaving = this.facade.passwordSaving;
  readonly passwordError = this.facade.passwordError;
  readonly passwordSuccess = this.facade.passwordSuccess;
  readonly deleteState = this.facade.deleteState;
  readonly isCapacityDialogOpen = signal(false);

  readonly filterForm = this.fb.group({
    subject: [''],
    status: [''],
    sortBy: ['name'],
  });
  readonly passwordForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    this.filterForm.valueChanges
      .pipe(startWith(this.filterForm.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.facade.setFilters(value.subject ?? '', value.status ?? '', value.sortBy ?? 'name');
      });
  }

  ngOnInit(): void {
    this.facade.loadTeachers();
  }

  toggleFilterPanel(): void {
    this.facade.toggleFilterPanel();
  }

  setSearchQuery(value: string): void {
    this.facade.setSearchQuery(value);
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

  selectAllTeachers(): void {
    this.facade.selectAllTeachers();
  }

  selectTeachersInGroupNow(): void {
    this.facade.selectTeachersInGroupNow();
  }

  selectAbsentTeachers(): void {
    this.facade.selectAbsentTeachers();
  }

  toggleSettings(event: Event, id: string): void {
    event.stopPropagation();
    this.facade.toggleSettings(id);
  }

  closeSettings(): void {
    this.facade.closeSettings();
  }

  openChat(teacher: Teacher): void {
    this.facade.openChat(teacher);
  }

  openChatFromRow(event: Event, teacher: Teacher): void {
    event.stopPropagation();
    this.openChat(teacher);
  }

  openEdit(event: Event, teacher: Teacher): void {
    event.stopPropagation();
    void this.router.navigate(['/tenant/teachers', teacher.id, 'edit']);
  }

  openTeacherDetails(teacher: Teacher): void {
    void this.router.navigate(['/tenant/teachers', teacher.id]);
  }

  previousPage(): void {
    this.facade.previousPage();
  }

  nextPage(): void {
    this.facade.nextPage();
  }

  setPageSize(value: string): void {
    this.facade.setPageSize(Number(value));
  }

  openCapacityDialog(): void {
    this.isCapacityDialogOpen.set(true);
  }

  closeCapacityDialog(): void {
    this.isCapacityDialogOpen.set(false);
  }

  openPasswordModal(event: Event, teacher: Teacher): void {
    event.stopPropagation();
    this.passwordForm.reset({ newPassword: '' });
    this.facade.openPasswordModal(teacher);
  }

  closePasswordModal(): void {
    this.passwordForm.reset({ newPassword: '' });
    this.facade.closePasswordModal();
  }

  submitPassword(): void {
    if (this.passwordForm.invalid || this.passwordSaving()) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.facade.changePassword(this.passwordForm.controls.newPassword.value ?? '');
  }

  updateStatus(id: string, status: 'Active' | 'Inactive'): void {
    this.facade.updateStatus(id, status);
  }

  requestDelete(event: Event, teacher: Teacher): void {
    event.stopPropagation();
    this.facade.requestDelete(teacher);
  }

  closeDeleteModal(): void {
    this.facade.closeDeleteModal();
  }

  confirmDelete(): void {
    this.facade.confirmDelete();
  }
}
