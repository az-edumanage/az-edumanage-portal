import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { TenantGroupDetailsDataService } from '../data-access/tenant-group-details-data.service';
import { TenantGroupExamCreateDataService } from '../data-access/tenant-group-exam-create-data.service';
import { PublishedGroupExamOption, TenantGroupExamCreatePayload } from '../models/tenant-group-exam-create.models';
import { TenantGroupExamCreateStore } from './tenant-group-exam-create.store';

@Injectable({ providedIn: 'root' })
export class TenantGroupExamCreateFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly data = inject(TenantGroupExamCreateDataService);
  private readonly groupDetailsData = inject(TenantGroupDetailsDataService);
  private readonly store = inject(TenantGroupExamCreateStore);

  private isSuccess = false;

  readonly groupId = this.store.groupId;
  readonly isSubmitting = this.store.isSubmitting;
  readonly groupContext = this.store.groupContext;
  readonly isGroupContextLoading = this.store.isGroupContextLoading;
  readonly groupContextError = this.store.groupContextError;
  readonly publishedExamOptions = this.store.filteredExamOptions;
  readonly allPublishedExamOptions = this.store.publishedExamOptions;
  readonly examSearchQuery = this.store.examSearchQuery;
  readonly isExamOptionsLoading = this.store.isExamOptionsLoading;
  readonly examOptionsError = this.store.examOptionsError;
  readonly previewExam = this.store.previewExam;
  readonly previewQuestions = this.store.previewQuestions;
  readonly isPreviewOpen = this.store.isPreviewOpen;
  readonly isPreviewLoading = this.store.isPreviewLoading;
  readonly previewError = this.store.previewError;

  readonly examForm = this.fb.group({
    selectedExamId: [null as string | null, Validators.required],
    title: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(3)]],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    startTime: [null as string | null],
    duration: [60, [Validators.required, Validators.min(1)]],
    instructions: [''],
    showResultsImmediately: [false],
    allowRetakes: [false],
  });

  initialize(groupId: string | null, freshCreate = false): void {
    this.store.setGroupId(groupId);
    if (freshCreate) {
      this.resetForm();
      this.taskService.removeTask(this.store.taskId());
    }
    this.loadGroupExamPage(freshCreate);

    const savedTask = this.taskService.getTask(this.store.taskId());
    if (!freshCreate && savedTask?.data) {
      this.examForm.patchValue(savedTask.data as Partial<TenantGroupExamCreatePayload>);
      this.taskService.removeTask(this.store.taskId());
    }
  }

  onDestroy(currentRoute: string): void {
    const value = this.examForm.getRawValue();
    const hasData = value.title !== '' || value.instructions !== '';

    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.store.taskId(),
        type: 'form',
        label: `Creating Exam: ${value.title || 'New Exam'}`,
        route: currentRoute,
        data: value,
      });
    }
  }

  onCancel(): void {
    this.isSuccess = true;
    this.taskService.removeTask(this.store.taskId());
    this.router.navigate(['/tenant/groups', this.groupId()]);
  }

  onSubmit(): void {
    if (this.examForm.invalid) {
      this.examForm.markAllAsTouched();
      return;
    }

    this.store.setSubmitting(true);
    const payload = this.examForm.getRawValue() as TenantGroupExamCreatePayload;
    this.data
      .saveGroupExamAssignment(this.groupId(), {
        selectedExamId: payload.selectedExamId || '',
        date: payload.date,
        startTime: this.normalizeStartTime(payload.startTime),
        duration: payload.duration,
        instructions: payload.instructions,
        showResultsImmediately: payload.showResultsImmediately,
        allowRetakes: payload.allowRetakes,
      })
      .pipe(finalize(() => this.store.setSubmitting(false)))
      .subscribe((assignment) => {
        this.isSuccess = true;
        this.store.setAssignment(assignment);
        this.taskService.removeTask(this.store.taskId());
        this.router.navigate(['/tenant/groups', this.groupId()]);
      });
  }

  selectPublishedExam(exam: PublishedGroupExamOption): void {
    this.examForm.patchValue({
      selectedExamId: exam.id,
      title: exam.title,
      instructions: this.examForm.controls.instructions.value || exam.instructions || '',
      showResultsImmediately: exam.showResultsImmediately ?? this.examForm.controls.showResultsImmediately.value ?? false,
      allowRetakes: exam.allowRetakes ?? this.examForm.controls.allowRetakes.value ?? false,
    });
  }

  setExamSearchQuery(query: string): void {
    this.store.setExamSearchQuery(query);
  }

  openQuestionPreview(exam: PublishedGroupExamOption): void {
    const groupContext = this.groupContext();
    if (!groupContext) {
      return;
    }
    this.store.openPreview(exam);
    this.loadPreviewQuestions(groupContext, exam);
  }

  retryQuestionPreview(): void {
    const groupContext = this.groupContext();
    const exam = this.previewExam();
    if (!groupContext || !exam) {
      return;
    }
    this.loadPreviewQuestions(groupContext, exam);
  }

  closeQuestionPreview(): void {
    this.store.closePreview();
  }

  retryExamOptions(): void {
    const groupContext = this.groupContext();
    if (!groupContext) {
      return;
    }
    this.loadPublishedExamOptions(groupContext);
  }

  private loadGroupExamPage(freshCreate = false): void {
    const groupId = this.groupId();
    this.store.setGroupContextLoading(true);
    this.store.setGroupContextError(null);
    forkJoin({
      groupContext: this.groupDetailsData.loadGroupById(groupId),
      assignment: this.data.loadGroupExamAssignment(groupId).pipe(catchError(() => of(null))),
    })
      .pipe(finalize(() => this.store.setGroupContextLoading(false)))
      .subscribe({
        next: ({ groupContext, assignment }) => {
          this.store.setGroupContext(groupContext);
          if (assignment && !freshCreate) {
            this.store.setAssignment(assignment);
            this.examForm.patchValue({
              selectedExamId: assignment.selectedExamId,
              title: assignment.examTitle,
              date: assignment.date,
              startTime: assignment.startTime || null,
              duration: assignment.duration,
              instructions: assignment.instructions || '',
              showResultsImmediately: assignment.showResultsImmediately,
              allowRetakes: assignment.allowRetakes,
            });
          }
          this.loadPublishedExamOptions(groupContext);
        },
        error: (error: Error) => {
          this.store.setGroupContextError(error.message || 'Unable to load group context');
        },
      });
  }

  private loadPublishedExamOptions(groupContext: { educationCategory?: string | null; stageId?: string | null; gradeId?: string | null; subjectId?: string | null }): void {
    if (groupContext.educationCategory !== 'BASIC_EDUCATION' || !groupContext.stageId || !groupContext.gradeId || !groupContext.subjectId) {
      this.store.setPublishedExamOptions([]);
      return;
    }
    this.store.setExamOptionsLoading(true);
    this.store.setExamOptionsError(null);
    this.data
      .loadPublishedExamOptions(groupContext.stageId, groupContext.gradeId, groupContext.subjectId)
      .pipe(finalize(() => this.store.setExamOptionsLoading(false)))
      .subscribe({
        next: (options) => this.store.setPublishedExamOptions(options),
        error: (error: Error) => {
          this.store.setPublishedExamOptions([]);
          this.store.setExamOptionsError(error.message || 'Unable to load published exams');
        },
      });
  }

  private loadPreviewQuestions(
    groupContext: { stageId?: string | null; gradeId?: string | null; subjectId?: string | null },
    exam: PublishedGroupExamOption,
  ): void {
    this.store.setPreviewLoading(true);
    this.store.setPreviewError(null);
    this.data
      .loadExamQuestions(groupContext.stageId, groupContext.gradeId, groupContext.subjectId, exam.id)
      .pipe(finalize(() => this.store.setPreviewLoading(false)))
      .subscribe({
        next: (questions) => this.store.setPreviewQuestions(questions),
        error: (error: Error) => {
          this.store.setPreviewQuestions([]);
          this.store.setPreviewError(error.message || 'Unable to load exam questions');
        },
      });
  }

  private normalizeStartTime(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private resetForm(): void {
    this.isSuccess = false;
    this.store.setAssignment(null);
    this.store.closePreview();
    this.store.setExamSearchQuery('');
    this.examForm.reset({
      selectedExamId: null,
      title: '',
      date: new Date().toISOString().split('T')[0],
      startTime: null,
      duration: 60,
      instructions: '',
      showResultsImmediately: false,
      allowRetakes: false,
    });
  }
}
