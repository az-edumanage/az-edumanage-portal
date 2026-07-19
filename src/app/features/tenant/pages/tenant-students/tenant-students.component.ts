import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, startWith } from 'rxjs';
import { TenantEducationalStagesDataService } from '../../data-access/tenant-educational-stages-data.service';
import { TenantGradesDataService } from '../../data-access/tenant-grades-data.service';
import { EducationalStage } from '../../models/tenant-educational-stages.models';
import { Grade } from '../../models/tenant-grades.models';
import { StudentAttendanceFilter } from '../../models/tenant-students.models';
import { TenantStudentsFacade } from '../../state/tenant-students.facade';
import { TenantStudentsDataService } from '../../data-access/tenant-students-data.service';
import { TaskService } from '../../../../core/services/task.service';
import { StudentRegistrationDataService } from '../../data-access/student-registration-data.service';
import { StudentRegistrationLink } from '../../models/student-registration.models';

@Component({
  selector: 'app-tenant-students',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-students.component.html',
  styleUrl: './tenant-students.component.css',
})
export class TenantStudentsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TenantStudentsFacade);
  private readonly studentsData = inject(TenantStudentsDataService);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly registrationData = inject(StudentRegistrationDataService);
  private readonly stagesData = inject(TenantEducationalStagesDataService);
  private readonly gradesData = inject(TenantGradesDataService);
  private readonly createStudentTaskId = 'create-student-task';

  readonly searchQuery = this.facade.searchQuery;
  readonly showFilterPanel = this.facade.showFilterPanel;
  readonly viewMode = this.facade.viewMode;
  readonly students = this.facade.students;
  readonly isLoading = this.facade.isLoading;
  readonly errorMessage = this.facade.errorMessage;
  readonly activeFiltersCount = this.facade.activeFiltersCount;
  readonly filteredStudents = this.facade.filteredStudents;
  readonly pagedStudents = this.facade.pagedStudents;
  readonly totalFilteredStudents = this.facade.totalFilteredStudents;
  readonly totalPages = this.facade.totalPages;
  readonly pageIndex = this.facade.pageIndex;
  readonly pageSize = this.facade.pageSize;
  readonly pageStart = this.facade.pageStart;
  readonly pageEnd = this.facade.pageEnd;
  readonly deleteState = this.facade.deleteState;
  readonly passwordModalStudent = this.facade.passwordModalStudent;
  readonly passwordSaving = this.facade.passwordSaving;
  readonly passwordError = this.facade.passwordError;
  readonly passwordSuccess = this.facade.passwordSuccess;
  readonly attendanceSummaryError = this.facade.attendanceSummaryError;
  readonly attendanceCards = this.facade.attendanceCards;
  readonly attendanceFilterLabel = this.facade.attendanceFilterLabel;
  readonly emptyStateTitle = this.facade.emptyStateTitle;
  readonly emptyStateDescription = this.facade.emptyStateDescription;
  readonly stages = signal<EducationalStage[]>([]);
  readonly grades = signal<Grade[]>([]);
  readonly selectedStageFilter = signal('');
  readonly pendingRegistrationCount = this.registrationData.pendingCount;
  readonly linkModalOpen = signal(false);
  readonly registrationLinks = signal<StudentRegistrationLink[]>([]);
  readonly linkExpiry = signal('');
  readonly generatedRegistrationUrl = signal('');
  readonly linkLoading = signal(false);
  readonly linkError = signal<string | null>(null);
  readonly linkCopied = signal(false);
  readonly copiedLinkId = signal<string | null>(null);
  readonly capacityDialogOpen = signal(false);
  readonly studentCapacity = signal<{ currentStudents: number; maxStudents: number | null } | null>(null);
  readonly stageOptions = computed(() => [...this.stages()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)));
  readonly gradeOptions = computed(() => {
    const stageId = this.selectedStageFilter();
    return [...this.grades()]
      .filter((grade) => !stageId || grade.stageId === stageId)
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly filterForm = this.fb.group({
    stage: [''],
    grade: [''],
    status: [''],
    sortBy: ['name'],
  });
  readonly passwordForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    this.registrationData.startCountPolling();
    this.facade.loadStudents();
    void this.loadFilterOptions();
    this.filterForm.valueChanges
      .pipe(startWith(this.filterForm.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const stage = value.stage ?? '';
        let grade = value.grade ?? '';
        if (this.selectedStageFilter() !== stage) {
          this.selectedStageFilter.set(stage);
          if (grade) {
            grade = '';
            this.filterForm.controls.grade.setValue('', { emitEvent: false });
          }
        }
        this.facade.setFilters(stage, grade, value.status ?? '', value.sortBy ?? 'name');
      });
  }

  toggleFilterPanel(): void {
    this.facade.toggleFilterPanel();
  }

  setSearchQuery(value: string): void {
    this.facade.setSearchQuery(value);
  }

  setAttendanceFilter(value: StudentAttendanceFilter): void {
    this.facade.setAttendanceFilter(value);
  }

  reloadAttendanceSummary(): void {
    this.facade.reloadAttendanceSummary();
  }

  clearAllFilters(): void {
    this.facade.clearAllFilters();
    this.clearAdvancedFilters();
  }

  clearAdvancedFilters(): void {
    this.facade.clearAdvancedFilters();
    this.selectedStageFilter.set('');
    this.filterForm.reset({
      stage: '',
      grade: '',
      status: '',
      sortBy: 'name',
    });
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

  async openCreateStudent(): Promise<void> {
    try {
      const capacity = await firstValueFrom(this.studentsData.capacity());
      this.studentCapacity.set(capacity);
      if (!capacity.canCreate) {
        this.capacityDialogOpen.set(true);
        return;
      }
    } catch {
      // The create endpoint remains the authoritative capacity guard.
    }
    this.taskService.removeTask(this.createStudentTaskId);
    void this.router.navigate(['/tenant/students/create']);
  }

  closeCapacityDialog(): void {
    this.capacityDialogOpen.set(false);
  }

  async openRegistrationLinks(): Promise<void> {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    this.linkExpiry.set(this.toLocalDateTime(expires));
    this.generatedRegistrationUrl.set('');
    this.linkCopied.set(false);
    this.copiedLinkId.set(null);
    this.linkError.set(null);
    this.linkModalOpen.set(true);
    this.linkLoading.set(true);
    try {
      this.registrationLinks.set(await firstValueFrom(this.registrationData.listLinks()));
    } catch (error) {
      this.linkError.set(this.registrationData.errorMessage(error, 'Registration links could not be loaded.'));
    } finally {
      this.linkLoading.set(false);
    }
  }

  closeRegistrationLinks(): void {
    if (!this.linkLoading()) this.linkModalOpen.set(false);
  }

  async createRegistrationLink(): Promise<void> {
    const expiresAt = new Date(this.linkExpiry());
    if (!this.linkExpiry() || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      this.linkError.set('Choose a future expiration date and time.');
      return;
    }
    this.linkLoading.set(true);
    this.linkError.set(null);
    this.linkCopied.set(false);
    try {
      const link = await firstValueFrom(this.registrationData.createLink(expiresAt.toISOString()));
      this.registrationLinks.update((items) => [link, ...items]);
      this.generatedRegistrationUrl.set(`${window.location.origin}/student-register/${link.token}`);
    } catch (error) {
      this.linkError.set(this.registrationData.errorMessage(error, 'Registration link could not be created.'));
    } finally {
      this.linkLoading.set(false);
    }
  }

  async copyRegistrationLink(): Promise<void> {
    const url = this.generatedRegistrationUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      this.linkCopied.set(true);
    } catch {
      this.linkError.set('Copy failed. Select the link and copy it manually.');
    }
  }

  async revokeRegistrationLink(link: StudentRegistrationLink): Promise<void> {
    if (!link.active || this.linkLoading()) return;
    this.linkLoading.set(true);
    this.linkError.set(null);
    try {
      const revoked = await firstValueFrom(this.registrationData.revokeLink(link.id));
      this.registrationLinks.update((items) => items.map((item) => item.id === revoked.id ? revoked : item));
    } catch (error) {
      this.linkError.set(this.registrationData.errorMessage(error, 'Registration link could not be revoked.'));
    } finally {
      this.linkLoading.set(false);
    }
  }

  registrationLinkUrl(link: StudentRegistrationLink): string {
    return link.token ? `${window.location.origin}/student-register/${link.token}` : '';
  }

  async copySavedRegistrationLink(link: StudentRegistrationLink): Promise<void> {
    const url = this.registrationLinkUrl(link);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      this.copiedLinkId.set(link.id);
    } catch {
      this.linkError.set('Copy failed. Select the link and copy it manually.');
    }
  }

  openStudentDetails(studentId: string): void {
    void this.router.navigate(['/tenant/students', studentId]);
  }

  openStudentEdit(event: Event, studentId: string): void {
    event.stopPropagation();
    void this.router.navigate(['/tenant/students', studentId, 'edit']);
  }

  requestDelete(event: Event, studentId: string): void {
    event.stopPropagation();
    this.facade.requestDelete(studentId);
  }

  openPasswordModal(event: Event, studentId: string): void {
    event.stopPropagation();
    this.passwordForm.reset({ newPassword: '' });
    this.facade.openPasswordModal(studentId);
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

  confirmDelete(): void {
    this.facade.confirmDelete();
  }

  closeDeleteModal(): void {
    this.facade.closeDeleteModal();
  }

  openStudentDetailsFromKeyboard(event: Event, studentId: string): void {
    event.preventDefault();
    this.openStudentDetails(studentId);
  }

  private async loadFilterOptions(): Promise<void> {
    try {
      const [stages, grades] = await Promise.all([
        this.stagesData.listStages(),
        this.gradesData.listGrades(),
      ]);
      this.stages.set(stages);
      this.grades.set(grades);
    } catch {
      this.stages.set([]);
      this.grades.set([]);
    }
  }

  private toLocalDateTime(date: Date): string {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }
}
