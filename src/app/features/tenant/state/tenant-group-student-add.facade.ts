import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { TenantGroupStudentAddDataService } from '../data-access/tenant-group-student-add-data.service';
import {
  TenantGroupStudent,
  TenantGroupStudentEnrollForm,
} from '../models/tenant-group-student-add.models';
import { TenantGroupStudentAddStore } from './tenant-group-student-add.store';

@Injectable({ providedIn: 'root' })
export class TenantGroupStudentAddFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly data = inject(TenantGroupStudentAddDataService);
  private readonly store = inject(TenantGroupStudentAddStore);

  private isSuccess = false;

  readonly groupId = this.store.groupId;
  readonly isSubmitting = this.store.isSubmitting;
  readonly selectedStudent = this.store.selectedStudent;
  readonly filteredStudents = this.store.filteredStudents;

  readonly enrollForm = this.fb.group({
    enrollDate: [new Date().toISOString().split('T')[0], Validators.required],
    discount: [0, [Validators.min(0), Validators.max(100)]],
    sendNotification: [true],
    generateInitialInvoice: [true],
  });

  initialize(groupId: string | null): void {
    this.store.setGroupId(groupId);
    this.filteredStudents.set([...this.data.allStudents]);

    const savedTask = this.taskService.getTask(this.store.taskId());
    if (savedTask?.data) {
      const taskData = savedTask.data as {
        form: Partial<TenantGroupStudentEnrollForm>;
        selectedStudent: TenantGroupStudent | null;
      };

      this.enrollForm.patchValue(taskData.form);
      if (taskData.selectedStudent) {
        this.selectedStudent.set(taskData.selectedStudent);
      }

      this.taskService.removeTask(this.store.taskId());
    }
  }

  onDestroy(currentRoute: string): void {
    if (this.selectedStudent() && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.store.taskId(),
        type: 'form',
        label: `Enrolling Student: ${this.selectedStudent()?.name || 'Unknown'}`,
        route: currentRoute,
        data: {
          form: this.enrollForm.getRawValue(),
          selectedStudent: this.selectedStudent(),
        },
      });
    }
  }

  onSearch(query: string): void {
    this.filteredStudents.set(this.data.searchStudents(query));
  }

  selectStudent(student: TenantGroupStudent): void {
    this.selectedStudent.set(student);
  }

  onEnroll(): void {
    const student = this.selectedStudent();
    if (!student) {
      return;
    }

    this.store.setSubmitting(true);

    const payload = {
      ...this.enrollForm.getRawValue(),
      student,
    };

    this.data
      .enrollStudentToGroup(payload)
      .pipe(finalize(() => this.store.setSubmitting(false)))
      .subscribe(() => {
        this.isSuccess = true;
        this.taskService.removeTask(this.store.taskId());
        this.router.navigate(['/tenant/groups', this.groupId()]);
      });
  }

  onCancel(): void {
    this.isSuccess = true;
    this.taskService.removeTask(this.store.taskId());
    this.router.navigate(['/tenant/groups', this.groupId()]);
  }
}
