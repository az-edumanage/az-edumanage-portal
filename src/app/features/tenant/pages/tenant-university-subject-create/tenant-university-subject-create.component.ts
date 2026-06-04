import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantUniversitySubjectsFacade } from '../../state/tenant-university-subjects.facade';

@Component({
  selector: 'app-tenant-university-subject-create',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule],
  templateUrl: './tenant-university-subject-create.component.html',
  styleUrl: './tenant-university-subject-create.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantUniversitySubjectCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantUniversitySubjectsFacade);

  readonly saving = this.facade.saving;
  readonly saveError = this.facade.saveError;
  readonly loadError = this.facade.loadError;
  readonly universityOptions = this.facade.universityOptions;
  readonly collegeOptions = this.facade.collegeOptions;
  readonly optionsLoading = this.facade.optionsLoading;
  readonly optionsError = this.facade.optionsError;
  readonly isEditMode = signal(false);
  private readonly subjectId = signal<string | null>(null);
  private readonly selectedUniversityId = signal('');

  readonly form = this.fb.nonNullable.group({
    universityId: ['', [Validators.required]],
    collegeId: ['', [Validators.required]],
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    description: [''],
  });

  readonly filteredCollegeOptions = computed(() => {
    const universityId = this.selectedUniversityId();
    return this.collegeOptions().filter((college) => !universityId || college.universityId === universityId);
  });

  async ngOnInit(): Promise<void> {
    await this.facade.loadOptions();
    const id = this.route.snapshot.paramMap.get('id');
    this.subjectId.set(id);
    this.isEditMode.set(!!id);
    if (!id) {
      const firstUniversity = this.universityOptions()[0]?.value ?? '';
      this.form.patchValue({ universityId: firstUniversity });
      this.selectedUniversityId.set(firstUniversity);
      this.resetCollegeForUniversity();
      return;
    }
    const subject = await this.facade.getSubject(id);
    if (subject) {
      this.form.reset({
        universityId: subject.universityId,
        collegeId: subject.collegeId,
        name: subject.name,
        description: subject.description ?? '',
      });
      this.selectedUniversityId.set(subject.universityId);
    }
  }

  onUniversityChange(): void {
    this.selectedUniversityId.set(this.form.controls.universityId.value);
    this.resetCollegeForUniversity();
  }

  async resetForm(): Promise<void> {
    const id = this.subjectId();
    if (id) {
      const subject = await this.facade.getSubject(id);
      if (subject) {
        this.form.reset({
          universityId: subject.universityId,
          collegeId: subject.collegeId,
          name: subject.name,
          description: subject.description ?? '',
        });
        this.selectedUniversityId.set(subject.universityId);
      }
      return;
    }

    const firstUniversity = this.universityOptions()[0]?.value ?? '';
    this.form.reset({
      universityId: firstUniversity,
      collegeId: '',
      name: '',
      description: '',
    });
    this.selectedUniversityId.set(firstUniversity);
    this.resetCollegeForUniversity();
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const saved = await this.facade.save(this.subjectId(), {
      universityId: value.universityId,
      collegeId: value.collegeId,
      name: value.name,
      description: value.description || null,
    });
    if (saved) {
      await this.facade.goToList();
    }
  }

  cancel(): void {
    void this.facade.goToList();
  }

  private resetCollegeForUniversity(): void {
    const firstCollege = this.filteredCollegeOptions()[0]?.value ?? '';
    this.form.controls.collegeId.setValue(firstCollege);
  }
}
