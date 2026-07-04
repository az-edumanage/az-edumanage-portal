import { Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TenantStudentCreateFacade } from '../../state/tenant-student-create.facade';
import { TenantParent } from '../../models/tenant-students.models';

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
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantStudentCreateFacade);
  readonly genderOptions = ['Male', 'Female'] as const;

  readonly isSubmitting = this.facade.isSubmitting;
  readonly isLoading = this.facade.isLoading;
  readonly errorMessage = this.facade.errorMessage;
  readonly isEditMode = this.facade.isEditMode;
  readonly studentForm = this.facade.studentForm;
  readonly stages = this.facade.stages;
  readonly universities = this.facade.universities;
  readonly availableGrades = this.facade.availableGrades;
  readonly availableColleges = this.facade.availableColleges;
  readonly parentsLoading = this.facade.parentsLoading;
  readonly filteredParents = this.facade.filteredParents;
  readonly parentSearchQuery = this.facade.parentSearchQuery;
  readonly addParentModalOpen = this.facade.addParentModalOpen;
  readonly addParentSaving = this.facade.addParentSaving;
  readonly addParentError = this.facade.addParentError;
  readonly addParentForm = this.facade.addParentForm;
  readonly openEducationDropdown = signal<StudentEducationDropdown | null>(null);
  readonly genderPanelOpen = signal(false);
  readonly parentPanelOpen = signal(false);
  readonly showPassword = signal(false);
  readonly showNewParentPassword = signal(false);
  readonly resetConfirmOpen = signal(false);

  ngOnInit(): void {
    this.facade.initialize(this.route.snapshot.paramMap.get('id'));
  }

  ngOnDestroy(): void {
    this.facade.onDestroy();
  }

  resetForm(): void {
    this.resetConfirmOpen.set(true);
  }

  closeResetConfirm(): void {
    this.resetConfirmOpen.set(false);
  }

  confirmResetForm(): void {
    this.facade.resetForm();
    this.resetConfirmOpen.set(false);
  }

  goBack(): void {
    this.facade.cancelDraft();
    this.location.back();
  }

  onSubmit(): void {
    this.facade.onSubmit();
  }

  @HostListener('document:click')
  closeDropdowns(): void {
    this.openEducationDropdown.set(null);
    this.genderPanelOpen.set(false);
    this.parentPanelOpen.set(false);
  }

  toggleEducationDropdown(dropdown: StudentEducationDropdown): void {
    this.openEducationDropdown.update((current) => (current === dropdown ? null : dropdown));
    this.parentPanelOpen.set(false);
  }

  isEducationDropdownOpen(dropdown: StudentEducationDropdown): boolean {
    return this.openEducationDropdown() === dropdown;
  }

  toggleGenderPanel(): void {
    this.openEducationDropdown.set(null);
    this.parentPanelOpen.set(false);
    this.genderPanelOpen.update((open) => !open);
  }

  toggleParentPanel(): void {
    this.openEducationDropdown.set(null);
    this.genderPanelOpen.set(false);
    this.parentPanelOpen.update((open) => !open);
  }

  selectedParent(): TenantParent | null {
    return this.facade.selectedParent();
  }

  selectParent(parent: TenantParent): void {
    this.facade.selectParent(parent);
    this.parentPanelOpen.set(false);
  }

  openAddParentModal(): void {
    this.parentPanelOpen.set(false);
    this.facade.openAddParentModal();
  }

  closeAddParentModal(): void {
    this.facade.closeAddParentModal();
  }

  submitAddParent(): void {
    this.facade.submitAddParent();
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
