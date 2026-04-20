import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TenantGroupCreateFacade } from '../state/tenant-group-create.facade';

@Component({
  selector: 'app-tenant-group-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-group-create.component.html',
  styleUrl: './tenant-group-create.component.css'})
export class TenantGroupCreateComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantGroupCreateFacade);

  readonly isSubmitting = this.facade.isSubmitting;
  readonly groupId = this.facade.groupId;
  readonly isEditMode = this.facade.isEditMode;
  readonly days = this.facade.days;
  readonly selectedDays = this.facade.selectedDays;

  readonly showOwnedByDropdown = this.facade.showOwnedByDropdown;
  readonly showTeacherDropdown = this.facade.showTeacherDropdown;
  readonly showGradeDropdown = this.facade.showGradeDropdown;
  readonly showSubjectDropdown = this.facade.showSubjectDropdown;
  readonly showRoomDropdown = this.facade.showRoomDropdown;

  readonly teacherSearchQuery = this.facade.teacherSearchQuery;
  readonly gradeSearchQuery = this.facade.gradeSearchQuery;
  readonly subjectSearchQuery = this.facade.subjectSearchQuery;
  readonly roomSearchQuery = this.facade.roomSearchQuery;

  readonly teachers = this.facade.teachers;
  readonly grades = this.facade.grades;
  readonly subjects = this.facade.subjects;
  readonly rooms = this.facade.rooms;
  readonly filteredTeachers = this.facade.filteredTeachers;
  readonly filteredGrades = this.facade.filteredGrades;
  readonly filteredSubjects = this.facade.filteredSubjects;
  readonly filteredRooms = this.facade.filteredRooms;

  readonly groupForm = this.facade.groupForm;

  ngOnInit(): void {
    this.facade.initialize(this.route.snapshot.paramMap.get('id'));
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

  selectTeacher(name: string): void {
    this.facade.selectTeacher(name);
  }

  toggleGradeDropdown(): void {
    this.facade.toggleGradeDropdown();
  }

  selectGrade(name: string): void {
    this.facade.selectGrade(name);
  }

  toggleSubjectDropdown(): void {
    this.facade.toggleSubjectDropdown();
  }

  selectSubject(name: string): void {
    this.facade.selectSubject(name);
  }

  toggleRoomDropdown(): void {
    this.facade.toggleRoomDropdown();
  }

  selectRoom(name: string): void {
    this.facade.selectRoom(name);
  }

  onCancel(): void {
    this.facade.onCancel();
  }

  onSubmit(): void {
    this.facade.onSubmit();
  }
}
