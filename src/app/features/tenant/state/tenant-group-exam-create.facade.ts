import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { TenantGroupDetailsDataService } from '../data-access/tenant-group-details-data.service';
import { TenantGroupExamCreateDataService } from '../data-access/tenant-group-exam-create-data.service';
import { GroupExamRow } from '../models/tenant-group-details.models';
import { PublishedGroupExamOption, TenantGroupExamCreatePayload } from '../models/tenant-group-exam-create.models';
import { TenantGroupExamCreateStore } from './tenant-group-exam-create.store';

interface TenantGroupExamCreateContext {
  scope?: 'tenant' | 'teacher';
  returnTo?: string | null;
  returnTab?: string | null;
  assignmentId?: string | null;
  selectedExamId?: string | null;
  examDate?: string | null;
  examStartTime?: string | null;
  examDuration?: string | null;
  instructions?: string | null;
  showResultsImmediately?: string | null;
  allowRetakes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TenantGroupExamCreateFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly data = inject(TenantGroupExamCreateDataService);
  private readonly groupDetailsData = inject(TenantGroupDetailsDataService);
  private readonly store = inject(TenantGroupExamCreateStore);

  private isSuccess = false;
  private returnTo: string | null = null;
  private returnTab: string | null = null;
  private assignmentId: string | null = null;
  private selectedExamId: string | null = null;
  private scope: 'tenant' | 'teacher' = 'tenant';
  private persistDraftTask = true;

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

  initialize(groupId: string | null, freshCreate = false, context: TenantGroupExamCreateContext = {}): void {
    this.store.setGroupId(groupId);
    this.scope = context.scope === 'teacher' ? 'teacher' : 'tenant';
    this.returnTo = this.normalizedReturnPath(context.returnTo);
    const isSessionHomeWork = this.isSessionHomeWorkContext(context);
    this.returnTab = isSessionHomeWork
      ? 'homeWork'
      : context.returnTab === 'students' || context.returnTab === 'lessons' || context.returnTab === 'exams'
        ? context.returnTab
        : null;
    this.assignmentId = context.assignmentId?.trim() || null;
    this.selectedExamId = context.selectedExamId?.trim() || null;
    this.persistDraftTask = !this.isSessionHomeWorkContext(context);
    if (this.isSessionHomeWorkContext(context) || this.selectedExamId) {
      this.examForm.controls.title.enable({ emitEvent: false });
    } else {
      this.examForm.controls.title.disable({ emitEvent: false });
    }
    if (freshCreate) {
      this.resetForm();
      this.taskService.removeTask(this.store.taskId());
    }
    if (context.examDate?.trim() || context.examStartTime?.trim()) {
      this.examForm.patchValue({
        date: context.examDate?.trim() || this.examForm.controls.date.value,
        startTime: this.normalizeStartTime(context.examStartTime),
      });
    }
    this.patchEditableSessionHomeWorkContext(context);
    this.loadGroupExamPage(freshCreate);

    const savedTask = this.taskService.getTask(this.store.taskId());
    if (!freshCreate && savedTask?.data) {
      this.examForm.patchValue(savedTask.data as Partial<TenantGroupExamCreatePayload>);
      this.taskService.removeTask(this.store.taskId());
    }
  }

  onDestroy(currentRoute: string): void {
    if (!this.persistDraftTask) {
      this.taskService.removeTask(this.store.taskId());
      return;
    }

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
    this.navigateAfterSave();
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
      }, { scope: this.scope })
      .pipe(finalize(() => this.store.setSubmitting(false)))
      .subscribe((assignment) => {
        this.isSuccess = true;
        this.store.setAssignment(assignment);
        this.taskService.removeTask(this.store.taskId());
        this.rememberPendingSessionHomeWorkAssignment(assignment);
        this.navigateAfterSave();
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
      groupContext: this.groupDetailsData.loadGroupById(groupId, { scope: this.scope }),
      assignment: this.data.loadGroupExamAssignment(groupId, { scope: this.scope }).pipe(catchError(() => of(null))),
      assignments: this.assignmentId
        ? this.groupDetailsData.loadGroupExams(groupId, { scope: this.scope }).pipe(catchError(() => of([] as GroupExamRow[])))
        : of([] as GroupExamRow[]),
    })
      .pipe(finalize(() => this.store.setGroupContextLoading(false)))
      .subscribe({
        next: ({ groupContext, assignment, assignments }) => {
          this.store.setGroupContext(groupContext);
          const assignmentToEdit = this.assignmentId
            ? assignments.find((row) => row.id === this.assignmentId)
            : null;
          if (assignmentToEdit && !freshCreate) {
            this.patchFromAssignmentRow(assignmentToEdit);
          } else if (assignment && !freshCreate) {
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
      .loadPublishedExamOptions(groupContext.stageId, groupContext.gradeId, groupContext.subjectId, { scope: this.scope })
      .pipe(finalize(() => this.store.setExamOptionsLoading(false)))
      .subscribe({
        next: (options) => {
          this.store.setPublishedExamOptions(options);
          const selectedExam = this.selectedExamId
            ? options.find((option) => option.id === this.selectedExamId)
            : null;
          if (selectedExam) {
            this.selectPublishedExam(selectedExam);
          }
        },
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
      .loadExamQuestions(groupContext.stageId, groupContext.gradeId, groupContext.subjectId, exam.id, { scope: this.scope })
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

  private patchEditableSessionHomeWorkContext(context: TenantGroupExamCreateContext): void {
    const patch: Partial<TenantGroupExamCreatePayload> = {};
    const duration = Number(context.examDuration);
    if (Number.isFinite(duration) && duration > 0) {
      patch.duration = duration;
    }
    if (context.instructions !== undefined && context.instructions !== null) {
      patch.instructions = context.instructions;
    }
    if (context.showResultsImmediately === 'true' || context.showResultsImmediately === 'false') {
      patch.showResultsImmediately = context.showResultsImmediately === 'true';
    }
    if (context.allowRetakes === 'true' || context.allowRetakes === 'false') {
      patch.allowRetakes = context.allowRetakes === 'true';
    }
    if (this.selectedExamId) {
      patch.selectedExamId = this.selectedExamId;
    }
    if (Object.keys(patch).length) {
      this.examForm.patchValue(patch);
    }
  }

  private patchFromAssignmentRow(assignment: GroupExamRow): void {
    this.store.setAssignment({
      groupId: assignment.groupId,
      selectedExamId: assignment.examId,
      examTitle: assignment.title,
      sourceStatus: assignment.status,
      date: assignment.date,
      startTime: assignment.startTime,
      duration: assignment.duration,
      instructions: assignment.instructions,
      showResultsImmediately: assignment.settings.showResultsImmediately,
      allowRetakes: assignment.settings.allowRetakes,
      updatedAt: assignment.updatedAt,
    });
    this.examForm.patchValue({
      selectedExamId: assignment.examId,
      title: assignment.title,
      date: assignment.date,
      startTime: assignment.startTime || null,
      duration: assignment.duration,
      instructions: assignment.instructions || '',
      showResultsImmediately: assignment.settings.showResultsImmediately,
      allowRetakes: assignment.settings.allowRetakes,
    });
  }

  private navigateAfterSave(): void {
    if (this.returnTo) {
      this.router.navigateByUrl(this.withReturnTab(this.returnTo));
      return;
    }
    this.router.navigate([this.scope === 'teacher' ? '/teacher/groups' : '/tenant/groups', this.groupId()]);
  }

  private withReturnTab(returnTo: string): string {
    if (!this.returnTab) {
      return returnTo;
    }
    const separator = returnTo.includes('?') ? '&' : '?';
    return `${returnTo}${separator}tab=${encodeURIComponent(this.returnTab)}`;
  }

  private rememberPendingSessionHomeWorkAssignment(assignment: {
    groupId: string;
    selectedExamId: string | null;
    examTitle: string;
    sourceStatus?: string | null;
    date: string;
    startTime?: string | null;
    duration: number;
    instructions?: string | null;
    showResultsImmediately: boolean;
    allowRetakes: boolean;
    updatedAt?: string | null;
  }): void {
    const sessionId = this.returnTo?.match(/\/sessions\/([^/?#]+)/)?.[1];
    if (!sessionId || !assignment.selectedExamId) {
      return;
    }

    sessionStorage.setItem(
      this.pendingSessionHomeWorkStorageKey(assignment.groupId, decodeURIComponent(sessionId)),
      JSON.stringify({
        id: `pending-${assignment.selectedExamId}-${assignment.date}-${assignment.startTime || 'anytime'}`,
        groupId: assignment.groupId,
        examId: assignment.selectedExamId,
        title: assignment.examTitle,
        status: assignment.sourceStatus || 'PUBLISHED',
        date: assignment.date,
        startTime: assignment.startTime ?? null,
        duration: assignment.duration,
        questionCount: null,
        instructions: assignment.instructions ?? null,
        updatedAt: assignment.updatedAt ?? null,
        settings: {
          showResultsImmediately: assignment.showResultsImmediately,
          allowRetakes: assignment.allowRetakes,
        },
      }),
    );
  }

  private pendingSessionHomeWorkStorageKey(groupId: string, sessionId: string): string {
    return `tenant.session-homework.pending.${groupId}.${this.toStorageKeyPart(sessionId)}`;
  }

  private toStorageKeyPart(value: string): string {
    return value.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  }

  private normalizedReturnPath(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    if (!trimmed || (!trimmed.startsWith('/tenant/') && !trimmed.startsWith('/teacher/'))) {
      return null;
    }
    return trimmed;
  }

  private isSessionHomeWorkContext(context: TenantGroupExamCreateContext): boolean {
    return (
      Boolean(context.returnTo?.includes('/sessions/')) ||
      Boolean(context.examDate?.trim()) ||
      Boolean(context.examStartTime?.trim())
    );
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
