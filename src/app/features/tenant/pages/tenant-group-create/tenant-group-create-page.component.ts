import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TenantGroupCreateFacade } from '../../state/tenant-group-create.facade';
import { TenantGroupSearchableSelectorComponent } from '../../components/tenant-group-searchable-selector/tenant-group-searchable-selector.component';
import { TenantGroupOwnedBySelectorComponent } from '../../components/tenant-group-owned-by-selector/tenant-group-owned-by-selector.component';
import { TenantGroupScheduleSectionComponent } from '../../components/tenant-group-schedule-section/tenant-group-schedule-section.component';

@Component({
  selector: 'app-tenant-group-create-page',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatIconModule,
    TenantGroupSearchableSelectorComponent,
    TenantGroupOwnedBySelectorComponent,
    TenantGroupScheduleSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-group-create-page.component.html',
  styleUrl: './tenant-group-create-page.component.css',
})
export class TenantGroupCreatePageComponent implements OnInit, OnDestroy {
  private readonly facade = inject(TenantGroupCreateFacade);
  private readonly route = inject(ActivatedRoute);

  readonly groupForm = this.facade.groupForm;
  readonly isSubmitting = this.facade.isSubmitting;
  readonly errorMessage = this.facade.errorMessage;
  readonly isLoadingTeacherAvailability = this.facade.isLoadingTeacherAvailability;
  readonly hasTeacherAvailabilityConflict = this.facade.hasTeacherAvailabilityConflict;
  readonly teacherUnavailableRanges = this.facade.teacherUnavailableRanges;
  readonly isLoadingRoomAvailability = this.facade.isLoadingRoomAvailability;
  readonly hasRoomAvailabilityConflict = this.facade.hasRoomAvailabilityConflict;
  readonly isEditMode = this.facade.isEditMode;
  readonly days = this.facade.days;
  readonly selectedDays = this.facade.selectedDays;

  readonly showOwnedByDropdown = this.facade.showOwnedByDropdown;
  readonly showTeacherDropdown = this.facade.showTeacherDropdown;
  readonly showStageDropdown = this.facade.showStageDropdown;
  readonly showGradeDropdown = this.facade.showGradeDropdown;
  readonly showUniversityDropdown = this.facade.showUniversityDropdown;
  readonly showCollegeDropdown = this.facade.showCollegeDropdown;
  readonly showSubjectDropdown = this.facade.showSubjectDropdown;
  readonly showRoomDropdown = this.facade.showRoomDropdown;

  readonly teacherSearchQuery = this.facade.teacherSearchQuery;
  readonly stageSearchQuery = this.facade.stageSearchQuery;
  readonly gradeSearchQuery = this.facade.gradeSearchQuery;
  readonly universitySearchQuery = this.facade.universitySearchQuery;
  readonly collegeSearchQuery = this.facade.collegeSearchQuery;
  readonly subjectSearchQuery = this.facade.subjectSearchQuery;
  readonly roomSearchQuery = this.facade.roomSearchQuery;

  readonly ownerChoices = this.facade.ownerChoices;
  readonly educationCategory = this.facade.educationCategory;
  readonly filteredStages = this.facade.filteredStages;
  readonly filteredTeachers = this.facade.filteredTeachers;
  readonly filteredGrades = this.facade.filteredGrades;
  readonly filteredUniversities = this.facade.filteredUniversities;
  readonly filteredColleges = this.facade.filteredColleges;
  readonly filteredSubjects = this.facade.filteredSubjects;
  readonly filteredRooms = this.facade.filteredRooms;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.facade.initialize(id);
  }

  ngOnDestroy(): void {
    this.facade.onDestroy();
  }

  onDayToggle(day: string): void {
    this.facade.onDayToggle(day);
  }

  onTimeTypeChange(isFixed: boolean): void {
    this.facade.onTimeTypeChange(isFixed);
  }

  toggleOwnedByDropdown(): void {
    this.facade.toggleOwnedByDropdown();
  }

  selectOwnedBy(value: string): void {
    this.facade.selectOwnedBy(value);
  }

  toggleTeacherDropdown(): void {
    this.facade.toggleTeacherDropdown();
  }

  selectTeacher(value: string): void {
    this.facade.selectTeacher(value);
  }

  onEducationCategoryChange(category: 'BASIC_EDUCATION' | 'UNIVERSITY_EDUCATION'): void {
    this.facade.onEducationCategoryChange(category);
  }

  toggleStageDropdown(): void {
    this.facade.toggleStageDropdown();
  }

  selectStage(value: string): void {
    this.facade.selectStage(value);
  }

  toggleGradeDropdown(): void {
    this.facade.toggleGradeDropdown();
  }

  selectGrade(value: string): void {
    this.facade.selectGrade(value);
  }

  toggleUniversityDropdown(): void {
    this.facade.toggleUniversityDropdown();
  }

  selectUniversity(value: string): void {
    this.facade.selectUniversity(value);
  }

  toggleCollegeDropdown(): void {
    this.facade.toggleCollegeDropdown();
  }

  selectCollege(value: string): void {
    this.facade.selectCollege(value);
  }

  toggleSubjectDropdown(): void {
    this.facade.toggleSubjectDropdown();
  }

  selectSubject(value: string): void {
    this.facade.selectSubject(value);
  }

  toggleRoomDropdown(): void {
    this.facade.toggleRoomDropdown();
  }

  selectRoom(value: string): void {
    this.facade.selectRoom(value);
  }

  setTeacherSearchQuery(value: string): void {
    this.facade.setTeacherSearchQuery(value);
  }

  setGradeSearchQuery(value: string): void {
    this.facade.setGradeSearchQuery(value);
  }

  setStageSearchQuery(value: string): void {
    this.facade.setStageSearchQuery(value);
  }

  setUniversitySearchQuery(value: string): void {
    this.facade.setUniversitySearchQuery(value);
  }

  setCollegeSearchQuery(value: string): void {
    this.facade.setCollegeSearchQuery(value);
  }

  setSubjectSearchQuery(value: string): void {
    this.facade.setSubjectSearchQuery(value);
  }

  setRoomSearchQuery(value: string): void {
    this.facade.setRoomSearchQuery(value);
  }

  onCancel(): void {
    this.facade.onCancel();
  }

  onSubmit(): void {
    this.facade.onSubmit();
  }
}
