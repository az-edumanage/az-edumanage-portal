import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantCollegesFacade } from '../../state/tenant-colleges.facade';

@Component({
  selector: 'app-tenant-college-create',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule],
  templateUrl: './tenant-college-create.component.html',
  styleUrl: './tenant-college-create.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantCollegeCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantCollegesFacade);

  readonly saving = this.facade.saving;
  readonly saveError = this.facade.saveError;
  readonly loadError = this.facade.loadError;
  readonly universityOptions = this.facade.universityOptions;
  readonly optionsLoading = this.facade.optionsLoading;
  readonly optionsError = this.facade.optionsError;
  readonly isEditMode = signal(false);
  private readonly collegeId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    universityId: ['', [Validators.required]],
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    description: [''],
  });

  async ngOnInit(): Promise<void> {
    await this.facade.loadUniversityOptions();
    const id = this.route.snapshot.paramMap.get('id');
    this.collegeId.set(id);
    this.isEditMode.set(!!id);
    if (!id) {
      this.form.patchValue({ universityId: this.universityOptions()[0]?.value ?? '' });
      return;
    }
    const college = await this.facade.getCollege(id);
    if (college) {
      this.form.reset({
        universityId: college.universityId,
        name: college.name,
        description: college.description ?? '',
      });
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const saved = await this.facade.save(this.collegeId(), {
      universityId: value.universityId,
      name: value.name,
      description: value.description || null,
    });
    if (saved) {
      await this.facade.goToList();
    }
  }

  resetForm(): void {
    this.form.reset({
      universityId: this.universityOptions()[0]?.value ?? '',
      name: '',
      description: '',
    });
  }

  goBack(): void {
    void this.facade.goToList();
  }
}
