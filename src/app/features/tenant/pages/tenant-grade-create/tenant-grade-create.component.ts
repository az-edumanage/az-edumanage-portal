import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TenantGradeCreateFacade } from '../../state/tenant-grade-create.facade';

@Component({
  selector: 'app-tenant-grade-create',
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-grade-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantGradeCreateComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantGradeCreateFacade);

  readonly isSubmitting = this.facade.isSubmitting;
  readonly saveError = this.facade.saveError;
  readonly loadError = this.facade.loadError;
  readonly isEditMode = this.facade.isEditMode;
  readonly gradeForm = this.facade.gradeForm;
  readonly countryOptions = this.facade.countryOptions;
  readonly academicLevelOptions = this.facade.academicLevelOptions;
  readonly countriesLoading = this.facade.countriesLoading;
  readonly countryCreating = this.facade.countryCreating;
  readonly levelsLoading = this.facade.levelsLoading;
  readonly countriesError = this.facade.countriesError;
  readonly countryCreateError = this.facade.countryCreateError;
  readonly levelsError = this.facade.levelsError;
  readonly countryPanelOpen = signal(false);
  readonly levelPanelOpen = signal(false);
  readonly newCountryName = signal('');

  ngOnInit(): void {
    void this.facade.initialize(
      this.route.snapshot.paramMap.get('id'),
      this.route.snapshot.queryParamMap.get('returnUrl'),
      this.route.snapshot.queryParamMap.get('freshCreate') === 'true',
    );
  }

  ngOnDestroy(): void {
    this.facade.onDestroy();
  }

  resetForm(): void {
    this.facade.resetForm();
    this.closePanels();
  }

  goBack(): void {
    this.facade.goBack();
  }

  onCountryChange(event: Event): void {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : '';
    void this.facade.onCountryChange(value);
  }

  selectedCountryLabel(): string {
    const selectedId = this.gradeForm.controls.countryId.value;
    if (this.countriesLoading()) {
      return 'Loading countries...';
    }
    if (!selectedId) {
      return 'Select country';
    }
    return this.countryOptions().find((country) => country.value === selectedId)?.label ?? 'Select country';
  }

  selectedLevelLabel(): string {
    const selectedId = this.gradeForm.controls.stageId.value;
    if (this.levelsLoading()) {
      return 'Loading academic levels...';
    }
    if (!this.gradeForm.controls.countryId.value) {
      return 'Select country first';
    }
    if (!selectedId) {
      return this.academicLevelOptions().length === 0 ? 'No academic levels available' : 'Select academic level';
    }
    return this.academicLevelOptions().find((stage) => stage.value === selectedId)?.label ?? 'Select academic level';
  }

  toggleCountryPanel(): void {
    if (this.countriesLoading()) {
      return;
    }
    this.facade.clearCountryCreateError();
    this.levelPanelOpen.set(false);
    this.countryPanelOpen.update((open) => !open);
  }

  toggleLevelPanel(): void {
    if (this.levelsLoading() || this.academicLevelOptions().length === 0) {
      return;
    }
    this.countryPanelOpen.set(false);
    this.levelPanelOpen.update((open) => !open);
  }

  closePanels(): void {
    this.countryPanelOpen.set(false);
    this.levelPanelOpen.set(false);
    this.newCountryName.set('');
    this.facade.clearCountryCreateError();
  }

  async selectCountry(countryId: string): Promise<void> {
    this.gradeForm.controls.countryId.setValue(countryId);
    this.gradeForm.controls.countryId.markAsTouched();
    this.countryPanelOpen.set(false);
    this.newCountryName.set('');
    await this.facade.onCountryChange(countryId);
  }

  selectLevel(stageId: string): void {
    this.gradeForm.controls.stageId.setValue(stageId);
    this.gradeForm.controls.stageId.markAsTouched();
    this.levelPanelOpen.set(false);
  }

  updateNewCountryName(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newCountryName.set(input.value);
  }

  async addCountry(): Promise<void> {
    const name = this.newCountryName().trim();
    if (!name || this.countryCreating()) {
      return;
    }

    const countryId = await this.facade.createCountryOption(name);
    if (countryId) {
      this.gradeForm.controls.countryId.markAsTouched();
      this.closePanels();
    }
  }

  onSubmit(): void {
    void this.facade.onSubmit();
  }
}
