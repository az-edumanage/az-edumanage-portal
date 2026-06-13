import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantUniversitiesFacade } from '../../state/tenant-universities.facade';

@Component({
  selector: 'app-tenant-university-create',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule],
  templateUrl: './tenant-university-create.component.html',
  styleUrl: './tenant-university-create.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantUniversityCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly facade = inject(TenantUniversitiesFacade);

  readonly modalMode = input(false);
  readonly titleId = input<string | null>(null);
  readonly closed = output<void>();
  readonly saved = output<void>();
  readonly saving = this.facade.saving;
  readonly saveError = this.facade.saveError;
  readonly loadError = this.facade.loadError;
  readonly countryOptions = this.facade.countryOptions;
  readonly optionsLoading = this.facade.optionsLoading;
  readonly optionsError = this.facade.optionsError;
  readonly isEditMode = signal(false);
  private readonly universityId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    countryId: ['', [Validators.required]],
    description: [''],
  });

  async ngOnInit(): Promise<void> {
    await this.facade.loadCountryOptions();
    const id = this.route.snapshot.paramMap.get('id');
    this.universityId.set(id);
    this.isEditMode.set(!!id);
    if (!id) {
      this.form.patchValue({ countryId: this.countryOptions()[0]?.id ?? '' });
      return;
    }
    const university = await this.facade.getUniversity(id);
    if (university) {
      this.form.reset({
        name: university.name,
        countryId: university.countryId ?? '',
        description: university.description ?? '',
      });
    }
  }

  private groupReturnUrl(): string | null {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl === '/tenant/groups/create' ? returnUrl : null;
  }

  private async goAfterCreate(): Promise<void> {
    const returnUrl = this.groupReturnUrl();
    if (returnUrl) {
      await this.router.navigateByUrl(returnUrl);
      return;
    }

    await this.facade.goToList();
  }

  private async goAfterCancel(): Promise<void> {
    const returnUrl = this.groupReturnUrl();
    if (returnUrl) {
      await this.router.navigateByUrl(returnUrl);
      return;
    }

    await this.facade.goToList();
  }

  resetForm(): void {
    this.form.reset({
      name: '',
      countryId: this.countryOptions()[0]?.id ?? '',
      description: '',
    });
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const saved = await this.facade.save(this.universityId(), {
      name: value.name,
      countryId: value.countryId,
      description: value.description || null,
    });
    if (saved) {
      if (this.modalMode()) {
        this.saved.emit();
        return;
      }
      await this.goAfterCreate();
    }
  }

  cancel(): void {
    if (this.modalMode()) {
      this.closed.emit();
      return;
    }
    void this.goAfterCancel();
  }
}
