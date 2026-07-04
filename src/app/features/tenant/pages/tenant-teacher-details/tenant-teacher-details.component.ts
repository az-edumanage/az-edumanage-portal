import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantTeachersDataService } from '../../data-access/tenant-teachers-data.service';
import { Teacher, TeacherGroup } from '../../models/tenant-teachers.models';

@Component({
  selector: 'app-tenant-teacher-details',
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './tenant-teacher-details.component.html',
  styleUrl: './tenant-teacher-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantTeacherDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly data = inject(TenantTeachersDataService);

  readonly teacher = signal<Teacher | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly exitGroupError = signal<string | null>(null);
  readonly exitingGroupId = signal<string | null>(null);
  readonly groupSearchQuery = signal('');
  readonly groupPageIndex = signal(0);
  readonly groupPageSize = signal(5);
  readonly groups = computed(() => this.teacher()?.groups ?? []);
  readonly teacherInitial = computed(() => this.teacher()?.name?.trim().charAt(0).toUpperCase() || 'T');
  readonly totalAssignedStudents = computed(() =>
    this.groups().reduce((total, group) => total + (Number(group.studentsCount) || 0), 0),
  );
  readonly primaryGroupLabel = computed(() => this.groups()[0]?.name || 'Not assigned');
  readonly filteredGroups = computed(() => {
    const query = this.groupSearchQuery().trim().toLowerCase();
    const groups = this.groups();

    if (!query) {
      return groups;
    }

    return groups.filter((group) =>
      [group.name, String(group.studentsCount)].some((value) => value.toLowerCase().includes(query)),
    );
  });
  readonly groupTotalItems = computed(() => this.filteredGroups().length);
  readonly groupTotalPages = computed(() => Math.max(1, Math.ceil(this.groupTotalItems() / this.groupPageSize())));
  readonly pagedGroups = computed(() => {
    const pageSize = this.groupPageSize();
    const start = this.groupPageIndex() * pageSize;
    return this.filteredGroups().slice(start, start + pageSize);
  });
  readonly groupPageStart = computed(() => (this.groupTotalItems() === 0 ? 0 : this.groupPageIndex() * this.groupPageSize() + 1));
  readonly groupPageEnd = computed(() => Math.min(this.groupTotalItems(), (this.groupPageIndex() + 1) * this.groupPageSize()));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Teacher not found');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.data.getTeacher(id).subscribe({
      next: (teacher) => {
        this.teacher.set(teacher);
        this.isLoading.set(false);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isLoading.set(false);
      },
    });
  }

  exitGroup(group: TeacherGroup): void {
    const currentTeacher = this.teacher();
    if (!currentTeacher || this.exitingGroupId()) {
      return;
    }
    this.exitingGroupId.set(group.id);
    this.exitGroupError.set(null);
    this.data.exitTeacherGroup(currentTeacher.id, group.id).subscribe({
      next: () => {
        this.teacher.update((teacher) => teacher ? {
          ...teacher,
          groups: (teacher.groups ?? []).filter((assignedGroup) => assignedGroup.id !== group.id),
        } : teacher);
        this.clampGroupPage();
        this.exitingGroupId.set(null);
      },
      error: (error: Error) => {
        this.exitGroupError.set(error.message);
        this.exitingGroupId.set(null);
      },
    });
  }

  setGroupSearchQuery(value: string): void {
    this.groupSearchQuery.set(value);
    this.groupPageIndex.set(0);
  }

  setGroupPageSize(value: number | string): void {
    const pageSize = Number(value);
    this.groupPageSize.set(Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 5);
    this.groupPageIndex.set(0);
  }

  previousGroupPage(): void {
    this.groupPageIndex.update((page) => Math.max(0, page - 1));
  }

  nextGroupPage(): void {
    this.groupPageIndex.update((page) => Math.min(this.groupTotalPages() - 1, page + 1));
  }

  groupTrack(group: TeacherGroup): string {
    return group.id;
  }

  private clampGroupPage(): void {
    this.groupPageIndex.update((page) => Math.min(page, this.groupTotalPages() - 1));
  }
}
