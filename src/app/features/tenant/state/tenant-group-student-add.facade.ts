import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { TenantGroupStudentAddDataService } from '../data-access/tenant-group-student-add-data.service';
import {
  TenantGroupStudent,
  TenantGroupStudentEnrollForm,
  TenantGroupStudentEnrollmentPayload,
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
  readonly isLoadingCandidates = this.store.isLoadingCandidates;
  readonly candidateError = this.store.candidateError;
  readonly selectedStudent = this.store.selectedStudent;
  readonly selectedStudents = this.store.selectedStudents;
  readonly selectedStudentIds = this.store.selectedStudentIds;
  readonly hasSelectedStudents = this.store.hasSelectedStudents;
  readonly filteredStudents = this.store.filteredStudents;

  readonly enrollForm = this.fb.group({
    enrollDate: [new Date().toISOString().split('T')[0], Validators.required],
    discount: [0, [Validators.min(0), Validators.max(100)]],
    sendNotification: [true],
    generateInitialInvoice: [true],
  });

  initialize(groupId: string | null): void {
    this.store.setGroupId(groupId);
    this.store.setCandidateStudents([]);

    const savedTask = this.taskService.getTask(this.store.taskId());
    let savedSelectedStudentIds: string[] = [];
    if (savedTask?.data) {
      const taskData = savedTask.data as {
        form: Partial<TenantGroupStudentEnrollForm>;
        selectedStudent?: TenantGroupStudent | null;
        selectedStudentIds?: string[];
      };

      this.enrollForm.patchValue(taskData.form);
      savedSelectedStudentIds = taskData.selectedStudentIds ?? (taskData.selectedStudent ? [taskData.selectedStudent.id] : []);

      this.taskService.removeTask(this.store.taskId());
    }
    this.enrollForm.patchValue({ generateInitialInvoice: false });

    this.store.setLoadingCandidates(true);
    this.store.setCandidateError(null);
    this.data
      .loadEligibleStudents(groupId)
      .pipe(finalize(() => this.store.setLoadingCandidates(false)))
      .subscribe({
        next: (students) => {
          this.store.setCandidateStudents(students);
          this.store.setSelectedStudentIds(savedSelectedStudentIds);
        },
        error: (error: Error) => {
          this.store.setCandidateStudents([]);
          this.store.setCandidateError(error.message);
        },
      });
  }

  onDestroy(currentRoute: string): void {
    if (this.hasSelectedStudents() && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.store.taskId(),
        type: 'form',
        label: `Enrolling Student: ${this.selectedStudents().map((student) => student.name).join(', ') || 'Unknown'}`,
        route: currentRoute,
        data: {
          form: this.enrollForm.getRawValue(),
          selectedStudentIds: this.selectedStudentIds(),
        },
      });
    }
  }

  onSearch(query: string): void {
    this.store.setFilteredStudents(this.data.searchStudents(query, this.store.candidateStudents()));
  }

  selectStudent(student: TenantGroupStudent): void {
    this.store.toggleStudent(student);
  }

  isStudentSelected(studentId: string): boolean {
    return this.store.isStudentSelected(studentId);
  }

  onEnroll(): void {
    const studentIds = this.selectedStudentIds();
    if (studentIds.length === 0) {
      return;
    }

    this.store.setSubmitting(true);

    const form = this.enrollForm.getRawValue();
    const payload: TenantGroupStudentEnrollmentPayload = {
      enrollDate: form.enrollDate ?? '',
      discount: form.discount ?? 0,
      sendNotification: form.sendNotification ?? false,
      generateInitialInvoice: form.generateInitialInvoice ?? false,
      studentIds,
    };

    this.data
      .enrollStudentsToGroup(this.groupId(), payload)
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
