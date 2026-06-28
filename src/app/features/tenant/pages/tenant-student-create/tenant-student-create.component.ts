import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TenantStudentCreateFacade } from '../../state/tenant-student-create.facade';

type StudentEducationDropdown = 'stages' | 'grades' | 'universities' | 'colleges';
type StudentEducationControl = 'stageIds' | 'gradeIds' | 'universityIds' | 'collegeIds';

@Component({
  selector: 'app-tenant-student-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-student-create.component.html',
  styleUrl: './tenant-student-create.component.css'})
export class TenantStudentCreateComponent implements OnInit, OnDestroy {
  private readonly location = inject(Location);
  private readonly facade = inject(TenantStudentCreateFacade);
  readonly genderOptions = ['Male', 'Female'] as const;

  readonly isSubmitting = this.facade.isSubmitting;
  readonly isLoading = this.facade.isLoading;
  readonly errorMessage = this.facade.errorMessage;
  readonly studentForm = this.facade.studentForm;
  readonly stages = this.facade.stages;
  readonly universities = this.facade.universities;
  readonly availableGrades = this.facade.availableGrades;
  readonly availableColleges = this.facade.availableColleges;
  readonly openEducationDropdown = signal<StudentEducationDropdown | null>(null);
  readonly genderPanelOpen = signal(false);
  readonly showPassword = signal(false);

  ngOnInit(): void {
    this.facade.initialize();
  }

  ngOnDestroy(): void {
    this.facade.onDestroy();
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

  toggleEducationDropdown(dropdown: StudentEducationDropdown): void {
    this.openEducationDropdown.update((current) => (current === dropdown ? null : dropdown));
  }

  isEducationDropdownOpen(dropdown: StudentEducationDropdown): boolean {
    return this.openEducationDropdown() === dropdown;
  }

  toggleGenderPanel(): void {
    this.openEducationDropdown.set(null);
    this.genderPanelOpen.update((open) => !open);
  }

  selectGender(gender: 'Male' | 'Female'): void {
    this.studentForm.controls.gender.setValue(gender);
    this.studentForm.controls.gender.markAsDirty();
    this.studentForm.controls.gender.markAsTouched();
    this.genderPanelOpen.set(false);
  }

  toggleMultiValue(controlName: StudentEducationControl, id: string): void {
    this.genderPanelOpen.set(false);
    const control = this.studentForm.controls[controlName];
    const current = control.value ?? [];
    control.setValue(current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    control.markAsDirty();
    control.markAsTouched();
  }

  isSelected(controlName: StudentEducationControl, id: string): boolean {
    return (this.studentForm.controls[controlName].value ?? []).includes(id);
  }

  selectedLabel(controlName: StudentEducationControl, fallback: string): string {
    const selectedIds = this.studentForm.controls[controlName].value ?? [];
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

  private optionsForControl(controlName: StudentEducationControl): { id: string; name: string }[] {
    switch (controlName) {
      case 'stageIds':
        return this.stages();
      case 'gradeIds':
        return this.availableGrades();
      case 'universityIds':
        return this.universities();
      case 'collegeIds':
        return this.availableColleges();
    }
  }
}
