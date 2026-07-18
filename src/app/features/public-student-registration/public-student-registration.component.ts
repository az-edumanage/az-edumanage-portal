import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { StudentRegistrationDataService } from '../tenant/data-access/student-registration-data.service';
import { PublicStudentRegistrationForm } from '../tenant/models/student-registration.models';

@Component({
  selector: 'app-public-student-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './public-student-registration.component.html',
  styleUrl: './public-student-registration.component.css',
})
export class PublicStudentRegistrationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly data = inject(StudentRegistrationDataService);
  private readonly token = this.route.snapshot.paramMap.get('token') ?? '';

  readonly metadata = signal<PublicStudentRegistrationForm | null>(null);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly submitted = signal(false);
  readonly language = signal<'en' | 'ar'>('en');
  readonly selectedStageId = signal('');
  readonly selectedUniversityId = signal('');
  readonly isArabic = computed(() => this.language() === 'ar');

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(160)]],
    email: ['', [Validators.email, Validators.maxLength(160)]],
    phone: ['', [Validators.maxLength(40)]],
    username: ['', [Validators.required, Validators.maxLength(120)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
    gender: ['', Validators.required],
    birthDate: ['', Validators.required],
    parentName: ['', Validators.maxLength(160)],
    parentPhone: ['', Validators.maxLength(40)],
    educationCategory: ['BASIC_EDUCATION', Validators.required],
    stageId: [''],
    gradeId: [''],
    universityId: [''],
    collegeId: [''],
  });

  readonly filteredGrades = computed(() => {
    const stageId = this.selectedStageId();
    return (this.metadata()?.grades ?? []).filter((grade) => grade.stageId === stageId);
  });
  readonly filteredColleges = computed(() => {
    const universityId = this.selectedUniversityId();
    return (this.metadata()?.colleges ?? []).filter((college) => college.universityId === universityId);
  });

  constructor() {
    void this.load();
    this.form.controls.stageId.valueChanges.subscribe((stageId) => {
      this.selectedStageId.set(stageId);
      this.form.controls.gradeId.setValue('');
    });
    this.form.controls.universityId.valueChanges.subscribe((universityId) => {
      this.selectedUniversityId.set(universityId);
      this.form.controls.collegeId.setValue('');
    });
    this.form.controls.educationCategory.valueChanges.subscribe(() => {
      this.form.patchValue({ stageId: '', gradeId: '', universityId: '', collegeId: '' }, { emitEvent: false });
      this.selectedStageId.set('');
      this.selectedUniversityId.set('');
    });
  }

  toggleLanguage(): void {
    this.language.update((language) => language === 'en' ? 'ar' : 'en');
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const basic = raw.educationCategory === 'BASIC_EDUCATION';
    if ((basic && (!raw.stageId || !raw.gradeId)) || (!basic && (!raw.universityId || !raw.collegeId))) {
      this.error.set(this.isArabic() ? 'يرجى استكمال بيانات المرحلة التعليمية.' : 'Complete the education details before submitting.');
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.data.submitPublicForm(this.token, {
        ...raw,
        stageId: basic ? raw.stageId : null,
        gradeId: basic ? raw.gradeId : null,
        universityId: basic ? null : raw.universityId,
        collegeId: basic ? null : raw.collegeId,
      }));
      this.submitted.set(true);
    } catch (error) {
      this.error.set(this.data.errorMessage(error, this.isArabic() ? 'تعذر إرسال طلب التسجيل.' : 'Registration could not be submitted.'));
    } finally {
      this.submitting.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      this.metadata.set(await firstValueFrom(this.data.loadPublicForm(this.token)));
    } catch (error) {
      this.error.set(this.data.errorMessage(error, 'This registration link is unavailable.'));
    } finally {
      this.loading.set(false);
    }
  }
}
