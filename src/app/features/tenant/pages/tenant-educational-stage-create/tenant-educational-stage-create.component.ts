import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
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
  readonly countriesError = this.facade.countriesError;
  readonly saving = this.facade.saving;
  readonly saveError = this.facade.saveError;

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
  }

  goBack(): void {
    void this.router.navigate(['/tenant/educational-stages']);
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
