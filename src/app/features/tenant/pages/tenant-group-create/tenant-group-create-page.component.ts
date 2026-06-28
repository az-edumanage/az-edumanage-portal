import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { startWith } from 'rxjs';
import { TenantGroupCreateFacade } from '../../state/tenant-group-create.facade';
import { TenantGroupSearchableSelectorComponent } from '../../components/tenant-group-searchable-selector/tenant-group-searchable-selector.component';
import { TenantGroupOwnedBySelectorComponent } from '../../components/tenant-group-owned-by-selector/tenant-group-owned-by-selector.component';
import { TenantGroupScheduleSectionComponent } from '../../components/tenant-group-schedule-section/tenant-group-schedule-section.component';
import { TenantGroupSelectorOption } from '../../models/tenant-group-create.models';
import {
  TenantSubscriptionPeriod,
  TenantSubscriptionPeriodDurationType,
  TenantSubscriptionPeriodSettingsService,
} from '../../data-access/tenant-subscription-period-settings.service';

@Component({
  selector: 'app-tenant-group-create-page',
  host: { '(click)': 'closeDropdowns()' },
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatIconModule,
    TenantGroupSearchableSelectorComponent,
    TenantGroupOwnedBySelectorComponent,
    TenantGroupScheduleSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-group-create-page.component.html',
  styleUrl: './tenant-group-create-page.component.css',
})
export class TenantGroupCreatePageComponent implements OnInit, OnDestroy {
  private readonly facade = inject(TenantGroupCreateFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly subscriptionPeriodSettings = inject(TenantSubscriptionPeriodSettingsService);

  readonly groupForm = this.facade.groupForm;
  readonly isSubmitting = this.facade.isSubmitting;
  readonly errorMessage = this.facade.errorMessage;
  readonly isLoadingTeacherAvailability = this.facade.isLoadingTeacherAvailability;
  readonly hasTeacherAvailabilityConflict = this.facade.hasTeacherAvailabilityConflict;
  readonly teacherUnavailableRanges = this.facade.teacherUnavailableRanges;
  readonly isLoadingRoomAvailability = this.facade.isLoadingRoomAvailability;
  readonly hasRoomAvailabilityConflict = this.facade.hasRoomAvailabilityConflict;
  readonly isEditMode = this.facade.isEditMode;
  readonly days = this.facade.days;
  readonly selectedDays = this.facade.selectedDays;

  readonly showOwnedByDropdown = this.facade.showOwnedByDropdown;
  readonly showTeacherDropdown = this.facade.showTeacherDropdown;
  readonly showStageDropdown = this.facade.showStageDropdown;
  readonly showGradeDropdown = this.facade.showGradeDropdown;
  readonly showUniversityDropdown = this.facade.showUniversityDropdown;
  readonly showCollegeDropdown = this.facade.showCollegeDropdown;
  readonly showSubjectDropdown = this.facade.showSubjectDropdown;
  readonly showRoomDropdown = this.facade.showRoomDropdown;

  readonly teacherSearchQuery = this.facade.teacherSearchQuery;
  readonly stageSearchQuery = this.facade.stageSearchQuery;
  readonly gradeSearchQuery = this.facade.gradeSearchQuery;
  readonly universitySearchQuery = this.facade.universitySearchQuery;
  readonly collegeSearchQuery = this.facade.collegeSearchQuery;
  readonly subjectSearchQuery = this.facade.subjectSearchQuery;
  readonly roomSearchQuery = this.facade.roomSearchQuery;

  readonly ownerChoices = this.facade.ownerChoices;
  readonly educationCategory = this.facade.educationCategory;
  readonly filteredStages = this.facade.filteredStages;
  readonly filteredTeachers = this.facade.filteredTeachers;
  readonly filteredGrades = this.facade.filteredGrades;
  readonly filteredUniversities = this.facade.filteredUniversities;
  readonly filteredColleges = this.facade.filteredColleges;
  readonly filteredSubjects = this.facade.filteredSubjects;
  readonly filteredRooms = this.facade.filteredRooms;
  readonly rooms = this.facade.rooms;

  readonly showPaymentMethodDropdown = signal(false);
  readonly paymentMethodSearchQuery = signal('');
  readonly paymentMethodOptions = signal<TenantGroupSelectorOption[]>([]);
  readonly paymentMethodsLoading = signal(false);
  readonly paymentMethodsLoadError = signal<string | null>(null);
  readonly showAddPaymentMethodModal = signal(false);
  readonly paymentMethodSaving = signal(false);
  readonly newPaymentMethodName = signal('');
  readonly newPaymentMethodDurationType = signal<TenantSubscriptionPeriodDurationType>('Month');
  readonly newPaymentMethodDurationValue = signal(1);
  readonly newPaymentMethodDescription = signal('');
  readonly newPaymentMethodNameError = signal<string | null>(null);
  readonly newPaymentMethodDurationError = signal<string | null>(null);
  readonly newPaymentMethodSaveError = signal<string | null>(null);
  readonly filteredPaymentMethods = computed(() => {
    const query = this.paymentMethodSearchQuery().toLowerCase();
    const options = this.paymentMethodOptions();
    if (!query) return options;
    return options.filter(
      (method) =>
        method.name.toLowerCase().includes(query) ||
        (method.subtitle ?? '').toLowerCase().includes(query),
    );
  });

  readonly paymentMethodEmptyText = computed(() => {
    if (this.paymentMethodsLoading()) {
      return 'Loading subscription periods...';
    }
    if (this.paymentMethodsLoadError()) {
      return this.paymentMethodsLoadError() ?? 'Unable to load subscription periods';
    }
    return 'No subscription periods found';
  });

  isGradeSelectorDisabled(): boolean {
    return this.educationCategory() === 'BASIC_EDUCATION' && !this.groupForm.get('stage')?.value;
  }

  isCollegeSelectorDisabled(): boolean {
    return this.educationCategory() === 'UNIVERSITY_EDUCATION' && !this.groupForm.get('university')?.value;
  }

  isSubjectSelectorDisabled(): boolean {
    if (this.educationCategory() === 'BASIC_EDUCATION') {
      return !this.groupForm.get('grade')?.value;
    }

    return !this.groupForm.get('college')?.value;
  }

  subjectCreateQueryParams(): Record<string, string> {
    return this.facade.subjectCreateQueryParams();
  }

  collegeCreateQueryParams(): Record<string, string> {
    return this.facade.collegeCreateQueryParams();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const freshCreate = !id && this.route.snapshot.queryParamMap.get('fresh') === 'true';
    this.facade.initialize(id, freshCreate);
    this.setupPaymentMethodSync();
    void this.loadSubscriptionPeriods();
  }

  ngOnDestroy(): void {
    this.facade.onDestroy();
  }

  onDayToggle(day: string): void {
    this.facade.onDayToggle(day);
  }

  onTimeTypeChange(isFixed: boolean): void {
    this.facade.onTimeTypeChange(isFixed);
  }

  toggleOwnedByDropdown(): void {
    this.closePaymentMethodDropdown();
    this.facade.toggleOwnedByDropdown();
  }

  selectOwnedBy(value: string): void {
    this.facade.selectOwnedBy(value);
  }

  toggleTeacherDropdown(): void {
    this.closePaymentMethodDropdown();
    this.facade.toggleTeacherDropdown();
  }

  selectTeacher(value: string): void {
    this.facade.selectTeacher(value);
  }

  onEducationCategoryChange(category: 'BASIC_EDUCATION' | 'UNIVERSITY_EDUCATION'): void {
    this.facade.onEducationCategoryChange(category);
  }

  toggleStageDropdown(): void {
    this.closePaymentMethodDropdown();
    this.facade.toggleStageDropdown();
  }

  selectStage(value: string): void {
    this.facade.selectStage(value);
  }

  toggleGradeDropdown(): void {
    if (this.isGradeSelectorDisabled()) {
      this.closeDropdowns();
      return;
    }

    this.closePaymentMethodDropdown();
    this.facade.toggleGradeDropdown();
  }

  selectGrade(value: string): void {
    this.facade.selectGrade(value);
  }

  toggleUniversityDropdown(): void {
    this.closePaymentMethodDropdown();
    this.facade.toggleUniversityDropdown();
  }

  selectUniversity(value: string): void {
    this.facade.selectUniversity(value);
  }

  toggleCollegeDropdown(): void {
    if (this.isCollegeSelectorDisabled()) {
      this.closeDropdowns();
      return;
    }

    this.closePaymentMethodDropdown();
    this.facade.toggleCollegeDropdown();
  }

  selectCollege(value: string): void {
    this.facade.selectCollege(value);
  }

  toggleSubjectDropdown(): void {
    if (this.isSubjectSelectorDisabled()) {
      this.closeDropdowns();
      return;
    }

    this.closePaymentMethodDropdown();
    this.facade.toggleSubjectDropdown();
  }

  togglePaymentMethodDropdown(): void {
    const next = !this.showPaymentMethodDropdown();
    this.facade.closeAllDropdowns();
    this.showPaymentMethodDropdown.set(next);
    if (next) {
      void this.loadSubscriptionPeriods();
    }
  }

  selectPaymentMethod(value: string): void {
    const method = this.paymentMethodOptions().find((option) => option.name === value);
    this.groupForm.patchValue({
      paymentMethod: value,
      paymentMethodId: method?.id ?? '',
    });
    this.showPaymentMethodDropdown.set(false);
  }

  selectSubject(value: string): void {
    this.facade.selectSubject(value);
  }

  toggleRoomDropdown(): void {
    this.closePaymentMethodDropdown();
    this.facade.toggleRoomDropdown();
  }

  selectRoom(value: string): void {
    this.facade.selectRoom(value);
  }

  setTeacherSearchQuery(value: string): void {
    this.facade.setTeacherSearchQuery(value);
  }

  setGradeSearchQuery(value: string): void {
    this.facade.setGradeSearchQuery(value);
  }

  setStageSearchQuery(value: string): void {
    this.facade.setStageSearchQuery(value);
  }

  setUniversitySearchQuery(value: string): void {
    this.facade.setUniversitySearchQuery(value);
  }

  setCollegeSearchQuery(value: string): void {
    this.facade.setCollegeSearchQuery(value);
  }

  setSubjectSearchQuery(value: string): void {
    this.facade.setSubjectSearchQuery(value);
  }

  setRoomSearchQuery(value: string): void {
    this.facade.setRoomSearchQuery(value);
  }

  setPaymentMethodSearchQuery(value: string): void {
    this.paymentMethodSearchQuery.set(value);
  }

  openAddPaymentMethodModal(): void {
    this.showPaymentMethodDropdown.set(false);
    this.newPaymentMethodName.set(this.paymentMethodSearchQuery().trim());
    this.newPaymentMethodDurationType.set('Month');
    this.newPaymentMethodDurationValue.set(1);
    this.newPaymentMethodDescription.set('');
    this.newPaymentMethodNameError.set(null);
    this.newPaymentMethodDurationError.set(null);
    this.newPaymentMethodSaveError.set(null);
    this.showAddPaymentMethodModal.set(true);
  }

  closeAddPaymentMethodModal(): void {
    if (this.paymentMethodSaving()) {
      return;
    }

    this.showAddPaymentMethodModal.set(false);
  }

  setNewPaymentMethodName(value: string): void {
    this.newPaymentMethodName.set(value);
    this.newPaymentMethodNameError.set(null);
  }

  selectNewPaymentMethodDurationType(value: TenantSubscriptionPeriodDurationType): void {
    this.newPaymentMethodDurationType.set(value);
  }

  setNewPaymentMethodDurationValue(value: string | number): void {
    this.newPaymentMethodDurationValue.set(Number(value));
    this.newPaymentMethodDurationError.set(null);
  }

  setNewPaymentMethodDescription(value: string): void {
    this.newPaymentMethodDescription.set(value);
  }

  async saveNewPaymentMethod(): Promise<void> {
    if (this.paymentMethodSaving()) {
      return;
    }

    const name = this.newPaymentMethodName().trim();
    const durationValue = Number(this.newPaymentMethodDurationValue());
    const description = this.newPaymentMethodDescription().trim();
    this.newPaymentMethodNameError.set(null);
    this.newPaymentMethodDurationError.set(null);
    this.newPaymentMethodSaveError.set(null);

    if (!name) {
      this.newPaymentMethodNameError.set('Method name is required.');
      return;
    }

    if (!Number.isFinite(durationValue) || durationValue < 1) {
      this.newPaymentMethodDurationError.set('Duration must be at least 1.');
      return;
    }

    this.paymentMethodSaving.set(true);
    try {
      const saved = await this.subscriptionPeriodSettings.createSubscriptionPeriod({
        name,
        durationType: this.newPaymentMethodDurationType(),
        durationValue: Math.trunc(durationValue),
        description: description || null,
      });
      const option = this.toPaymentMethodOption(saved);
      this.paymentMethodOptions.update((options) => {
        const next = options.some((item) => item.id === option.id)
          ? options.map((item) => item.id === option.id ? option : item)
          : [...options, option];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });
      this.groupForm.patchValue({
        paymentMethod: option.name,
        paymentMethodId: option.id,
      });
      this.paymentMethodSearchQuery.set('');
      this.showAddPaymentMethodModal.set(false);
    } catch (error) {
      this.newPaymentMethodSaveError.set(this.subscriptionPeriodSettings.toUserMessage(error));
    } finally {
      this.paymentMethodSaving.set(false);
    }
  }

  closeDropdowns(): void {
    this.facade.closeAllDropdowns();
    this.closePaymentMethodDropdown();
  }

  private closePaymentMethodDropdown(): void {
    this.showPaymentMethodDropdown.set(false);
  }

  private async loadSubscriptionPeriods(): Promise<void> {
    this.paymentMethodsLoading.set(true);
    this.paymentMethodsLoadError.set(null);
    try {
      const periods = await this.subscriptionPeriodSettings.listSubscriptionPeriods();
      this.paymentMethodOptions.set(periods.map((period) => this.toPaymentMethodOption(period)));
      this.syncSelectedPaymentMethod(true);
    } catch {
      this.paymentMethodOptions.set([]);
      this.paymentMethodsLoadError.set('Unable to load subscription periods');
    } finally {
      this.paymentMethodsLoading.set(false);
    }
  }

  private toPaymentMethodOption(period: TenantSubscriptionPeriod): TenantGroupSelectorOption {
    const durationLabel = period.durationValue + ' ' + period.durationType + (period.durationValue === 1 ? '' : 's');
    return {
      id: period.id,
      name: period.name,
      subtitle: period.description?.trim() || durationLabel,
    };
  }

  private setupPaymentMethodSync(): void {
    this.groupForm.get('paymentMethodId')?.valueChanges
      .pipe(startWith(this.groupForm.get('paymentMethodId')?.value ?? ''), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncSelectedPaymentMethod(false));
  }

  private syncSelectedPaymentMethod(clearMissingName: boolean): void {
    const selected = this.groupForm.get('paymentMethod')?.value ?? '';
    const selectedId = this.groupForm.get('paymentMethodId')?.value ?? '';
    const methods = this.paymentMethodOptions();

    if (selectedId) {
      const method = methods.find((option) => option.id === selectedId);
      if (method) {
        this.groupForm.patchValue({ paymentMethod: method.name, paymentMethodId: method.id }, { emitEvent: false });
        return;
      }
    }

    if (!selected) {
      return;
    }

    const method = methods.find((option) => option.name === selected);
    if (method) {
      this.groupForm.patchValue({ paymentMethod: method.name, paymentMethodId: method.id }, { emitEvent: false });
    } else if (clearMissingName) {
      this.groupForm.patchValue({ paymentMethod: '', paymentMethodId: '' }, { emitEvent: false });
    }
  }

  onCancel(): void {
    this.facade.onCancel();
  }

  onSubmit(): void {
    this.facade.onSubmit();
  }
}
