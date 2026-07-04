import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { TeacherApiService } from '../../data-access/teacher-api.service';
import { TeacherAssignedGroup } from '../../models/teacher.models';

@Component({
  selector: 'app-teacher-attendance',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './teacher-attendance.component.html',
  styleUrl: './teacher-attendance.component.css',
})
export class TeacherAttendanceComponent {
  private readonly teacherApi = inject(TeacherApiService);

  readonly groups = signal<TeacherAssignedGroup[]>([]);
  readonly groupsLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.loadGroups();
  }

  loadGroups(): void {
    this.groupsLoading.set(true);
    this.errorMessage.set(null);
    this.teacherApi.loadAssignedGroups()
      .pipe(finalize(() => this.groupsLoading.set(false)))
      .subscribe({
        next: (groups) => this.groups.set(groups ?? []),
        error: (error: Error) => this.errorMessage.set(error.message || 'Unable to load groups'),
      });
  }

  formatGroupEducation(group: TeacherAssignedGroup): string {
    if (group.educationCategory === 'UNIVERSITY_EDUCATION') {
      return [group.university, group.college].map((value) => value?.trim()).filter(Boolean).join(' / ') || 'University Education';
    }
    return [group.stage, group.grade].map((value) => value?.trim()).filter(Boolean).join(' / ') || 'Basic Education';
  }

  trackByGroupId(_: number, group: TeacherAssignedGroup): string {
    return group.id;
  }
}
