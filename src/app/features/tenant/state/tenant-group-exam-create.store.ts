import { computed, Injectable, signal } from '@angular/core';
import { GroupDetails } from '../models/tenant-group-details.models';
import { GroupExamAssignment, GroupExamPreviewQuestion, PublishedGroupExamOption } from '../models/tenant-group-exam-create.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupExamCreateStore {
  readonly groupId = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly taskId = signal('');
  readonly groupContext = signal<GroupDetails | null>(null);
  readonly isGroupContextLoading = signal(false);
  readonly groupContextError = signal<string | null>(null);
  readonly assignment = signal<GroupExamAssignment | null>(null);
  readonly publishedExamOptions = signal<PublishedGroupExamOption[]>([]);
  readonly examSearchQuery = signal('');
  readonly isExamOptionsLoading = signal(false);
  readonly examOptionsError = signal<string | null>(null);
  readonly previewExam = signal<PublishedGroupExamOption | null>(null);
  readonly previewQuestions = signal<GroupExamPreviewQuestion[]>([]);
  readonly isPreviewOpen = signal(false);
  readonly isPreviewLoading = signal(false);
  readonly previewError = signal<string | null>(null);
  readonly filteredExamOptions = computed(() => {
    const query = this.examSearchQuery().trim().toLowerCase();
    const options = this.publishedExamOptions();
    if (!query) {
      return options;
    }
    return options.filter((option) => [
      option.title,
      option.status,
      option.instructions,
      `${option.questionCount} questions`,
      option.createdAt,
      option.updatedAt,
    ].some((value) => `${value ?? ''}`.toLowerCase().includes(query)));
  });

  setGroupId(groupId: string | null): void {
    this.groupId.set(groupId);
    this.taskId.set(`create-exam-group-${groupId}`);
  }

  setSubmitting(value: boolean): void {
    this.isSubmitting.set(value);
  }

  setGroupContextLoading(value: boolean): void {
    this.isGroupContextLoading.set(value);
  }

  setGroupContext(groupContext: GroupDetails | null): void {
    this.groupContext.set(groupContext);
    this.groupContextError.set(null);
  }

  setGroupContextError(message: string | null): void {
    this.groupContextError.set(message);
    if (message) {
      this.groupContext.set(null);
    }
  }

  setAssignment(assignment: GroupExamAssignment | null): void {
    this.assignment.set(assignment);
  }

  setExamOptionsLoading(value: boolean): void {
    this.isExamOptionsLoading.set(value);
  }

  setPublishedExamOptions(options: PublishedGroupExamOption[]): void {
    this.publishedExamOptions.set(options);
    this.examOptionsError.set(null);
  }

  setExamOptionsError(message: string | null): void {
    this.examOptionsError.set(message);
  }

  setExamSearchQuery(query: string): void {
    this.examSearchQuery.set(query);
  }

  openPreview(exam: PublishedGroupExamOption): void {
    this.previewExam.set(exam);
    this.previewQuestions.set([]);
    this.previewError.set(null);
    this.isPreviewOpen.set(true);
  }

  closePreview(): void {
    this.isPreviewOpen.set(false);
    this.previewExam.set(null);
    this.previewQuestions.set([]);
    this.previewError.set(null);
    this.isPreviewLoading.set(false);
  }

  setPreviewLoading(value: boolean): void {
    this.isPreviewLoading.set(value);
  }

  setPreviewQuestions(questions: GroupExamPreviewQuestion[]): void {
    this.previewQuestions.set(questions);
    this.previewError.set(null);
  }

  setPreviewError(message: string | null): void {
    this.previewError.set(message);
  }
}
