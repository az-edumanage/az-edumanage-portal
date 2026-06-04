import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TenantTeacherCreateFacade } from '../../state/tenant-teacher-create.facade';

type TeacherEducationDropdown = 'stages' | 'grades' | 'subjects' | 'universities' | 'colleges' | 'universitySubjects';
type TeacherEducationControl = 'stageIds' | 'gradeIds' | 'subjectIds' | 'universityIds' | 'collegeIds' | 'universitySubjectIds';

@Component({
  selector: 'app-tenant-teacher-create',
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-teacher-create.component.html',
  styleUrl: './tenant-teacher-create.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantTeacherCreateComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly facade = inject(TenantTeacherCreateFacade);

  readonly isSubmitting = this.facade.isSubmitting;
  readonly isLoading = this.facade.isLoading;
  readonly errorMessage = this.facade.errorMessage;
  readonly showPassword = this.facade.showPassword;
  readonly teacherId = this.facade.teacherId;
  readonly isEditMode = this.facade.isEditMode;
  readonly teacherForm = this.facade.teacherForm;
  readonly stages = this.facade.stages;
  readonly universities = this.facade.universities;
  readonly availableGrades = this.facade.availableGrades;
  readonly availableSubjects = this.facade.availableSubjects;
  readonly availableColleges = this.facade.availableColleges;
  readonly availableUniversitySubjects = this.facade.availableUniversitySubjects;
  readonly openEducationDropdown = signal<TeacherEducationDropdown | null>(null);

  ngOnInit(): void {
    this.facade.initialize(this.route.snapshot.paramMap.get('id'));
  }

  ngOnDestroy(): void {
    this.facade.onDestroy(this.router.url);
  }

  resetForm(): void {
    if (confirm('Are you sure you want to clear all fields?')) {
      this.facade.resetForm();
    }
  }

  goBack(): void {
    this.facade.cancelDraft();
    this.location.back();
  }

  onSubmit(): void {
    this.facade.onSubmit();
  }

  onDocumentsSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.facade.setDocuments(input.files);
    input.value = '';
  }

  removeDocument(fileName: string): void {
    const documents = (this.teacherForm.controls.documents.value ?? []).filter((document) => document.fileName !== fileName);
    this.teacherForm.controls.documents.setValue(documents);
  }

  selectedDocuments() {
    return this.teacherForm.controls.documents.value ?? [];
  }

  toggleEducationDropdown(dropdown: TeacherEducationDropdown): void {
    this.openEducationDropdown.update((current) => (current === dropdown ? null : dropdown));
  }

  isEducationDropdownOpen(dropdown: TeacherEducationDropdown): boolean {
    return this.openEducationDropdown() === dropdown;
  }

  toggleMultiValue(controlName: TeacherEducationControl, id: string): void {
    const control = this.teacherForm.controls[controlName];
    const current = control.value ?? [];
    control.setValue(current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    control.markAsDirty();
    control.markAsTouched();
  }

  isSelected(controlName: TeacherEducationControl, id: string): boolean {
    return (this.teacherForm.controls[controlName].value ?? []).includes(id);
  }

  selectedLabel(controlName: TeacherEducationControl, fallback: string): string {
    const selectedIds = this.teacherForm.controls[controlName].value ?? [];
    if (selectedIds.length === 0) {
      return fallback;
    }

    const options = this.optionsForControl(controlName);
    const selectedNames = options.filter((option) => selectedIds.includes(option.id)).map((option) => option.name);

    if (selectedNames.length <= 2) {
      return selectedNames.join(', ');
    }

    return `${selectedNames.slice(0, 2).join(', ')} +${selectedNames.length - 2}`;
  }

  subjectGradeName(gradeId: string): string {
    return this.availableGrades().find((grade) => grade.id === gradeId)?.name ?? 'Selected grade';
  }

  universitySubjectCollegeName(collegeId: string): string {
    return this.availableColleges().find((college) => college.id === collegeId)?.name ?? 'Selected college';
  }

  formatFileSize(sizeBytes?: number | null): string {
    if (!sizeBytes) {
      return '0 KB';
    }
    if (sizeBytes < 1024 * 1024) {
      return `${Math.ceil(sizeBytes / 1024)} KB`;
    }
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private optionsForControl(controlName: TeacherEducationControl): { id: string; name: string }[] {
    switch (controlName) {
      case 'stageIds':
        return this.stages();
      case 'gradeIds':
        return this.availableGrades();
      case 'subjectIds':
        return this.availableSubjects();
      case 'universityIds':
        return this.universities();
      case 'collegeIds':
        return this.availableColleges();
      case 'universitySubjectIds':
        return this.availableUniversitySubjects();
    }
  }
}
