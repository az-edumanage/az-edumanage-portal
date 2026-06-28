import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TenantEducationalStagesFacade } from '../../state/tenant-educational-stages.facade';

@Component({
  selector: 'app-tenant-educational-stage-create',
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './tenant-educational-stage-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantEducationalStageCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantEducationalStagesFacade);

  readonly countryOptions = this.facade.countryOptions;
  readonly countriesLoading = this.facade.countriesLoading;
  readonly countryCreating = this.facade.countryCreating;
  readonly countriesError = this.facade.countriesError;
  readonly countryCreateError = this.facade.countryCreateError;
  readonly saving = this.facade.saving;
  readonly saveError = this.facade.saveError;
  readonly countryPanelOpen = signal(false);
  readonly newCountryName = signal('');

  readonly stageForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    countryId: ['', [Validators.required]],
    description: [''],
  });

  async ngOnInit(): Promise<void> {
    await this.facade.loadCountryOptions();
    const firstCountry = this.countryOptions()[0]?.value ?? '';
    if (!this.stageForm.controls.countryId.value && firstCountry) {
      this.stageForm.controls.countryId.setValue(firstCountry);
    }
  }

  resetForm(): void {
    this.stageForm.reset({
      name: '',
      countryId: this.countryOptions()[0]?.value ?? '',
      description: '',
    });
    this.closeCountryPanel();
  }

  goBack(): void {
    void this.router.navigate(['/tenant/educational-stages']);
  }

  selectedCountryLabel(): string {
    const selectedId = this.stageForm.controls.countryId.value;
    if (this.countriesLoading()) {
      return 'Loading countries...';
    }
    if (!selectedId) {
      return 'Select country';
    }
    return this.countryOptions().find((country) => country.value === selectedId)?.label ?? 'Select country';
  }

  toggleCountryPanel(): void {
    if (this.countriesLoading()) {
      return;
    }
    this.facade.clearCountryCreateError();
    this.countryPanelOpen.update((open) => !open);
  }

  closeCountryPanel(): void {
    this.countryPanelOpen.set(false);
    this.newCountryName.set('');
    this.facade.clearCountryCreateError();
  }

  selectCountry(countryId: string): void {
    this.stageForm.controls.countryId.setValue(countryId);
    this.stageForm.controls.countryId.markAsTouched();
    this.closeCountryPanel();
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

    const country = await this.facade.createCountryOption(name);
    if (country) {
      this.stageForm.controls.countryId.setValue(country.value);
      this.stageForm.controls.countryId.markAsTouched();
      this.closeCountryPanel();
    }
  }

  private afterSaveUrl(): string {
    const candidate = this.route.snapshot.queryParamMap.get('returnUrl');
    if (candidate === '/tenant/groups/create') {
      return candidate;
    }

    return '/tenant/educational-stages';
  }

  async onSubmit(): Promise<void> {
    if (this.stageForm.invalid || this.saving() || this.countriesLoading()) {
      this.stageForm.markAllAsTouched();
      return;
    }

    const saved = await this.facade.createStage(this.stageForm.getRawValue());
    if (saved) {
      void this.router.navigateByUrl(this.afterSaveUrl());
    }
  }
}
