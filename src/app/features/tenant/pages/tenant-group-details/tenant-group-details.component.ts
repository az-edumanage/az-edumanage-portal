import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { GroupStudent } from '../../models/tenant-group-details.models';
import { TenantGroupDetailsFacade } from '../../state/tenant-group-details.facade';

@Component({
  selector: 'app-tenant-group-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-group-details.component.html',
  styleUrl: './tenant-group-details.component.css'})
export class TenantGroupDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantGroupDetailsFacade);

  readonly group = this.facade.group;
  readonly selectedStudent = this.facade.selectedStudent;
  readonly students = this.facade.students;
  readonly isLoading = this.facade.isLoading;
  readonly error = this.facade.error;
  readonly exitStudentError = this.facade.exitStudentError;
  readonly exitingStudentId = this.facade.exitingStudentId;
  readonly avgAttendanceLabel = this.facade.avgAttendanceLabel;
  readonly absenceRateLabel = this.facade.absenceRateLabel;
  readonly monthlyRevenueLabel = this.facade.monthlyRevenueLabel;
  readonly capacityUsageLabel = this.facade.capacityUsageLabel;
  readonly groupId = this.route.snapshot.paramMap.get('id');

  ngOnInit(): void {
    this.facade.loadGroup(this.groupId);
  }

  selectStudent(student: GroupStudent): void {
    this.facade.selectStudent(student);
  }

  clearSelectedStudent(): void {
    this.facade.clearSelectedStudent();
  }

  exitGroup(event: Event, student: GroupStudent): void {
    event.stopPropagation();
    this.facade.removeStudentFromGroup(this.groupId, student);
  }
}
