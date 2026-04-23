import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TenantGroupAttendanceFacade } from '../../state/tenant-group-attendance.facade';

@Component({
  selector: 'app-tenant-group-attendance',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './tenant-group-attendance.component.html'})
export class TenantGroupAttendanceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantGroupAttendanceFacade);

  readonly groupId = this.facade.groupId;
  readonly today = this.facade.today;
  readonly students = this.facade.students;
  readonly presentCount = this.facade.presentCount;
  readonly absentCount = this.facade.absentCount;
  readonly attendanceRate = this.facade.attendanceRate;

  ngOnInit() {
    this.facade.loadGroup(this.route.snapshot.paramMap.get('id'));
  }

  toggleAttendance(id: string, isPresent: boolean) {
    this.facade.toggleAttendance(id, isPresent);
  }

  markAll(isPresent: boolean) {
    this.facade.markAll(isPresent);
  }

  async saveAttendance() {
    await this.facade.saveAttendance();
    alert('Attendance saved successfully!');
  }
}
