import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantTeachersDataService } from '../../data-access/tenant-teachers-data.service';
import { Teacher } from '../../models/tenant-teachers.models';

@Component({
  selector: 'app-tenant-teacher-details',
  imports: [CommonModule, RouterModule, MatIconModule],
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
  readonly groups = computed(() => this.teacher()?.groups ?? []);

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
}
