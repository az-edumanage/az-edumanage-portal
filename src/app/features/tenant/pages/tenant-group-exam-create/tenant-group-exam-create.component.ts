import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TenantGroupExamCreateFacade } from '../../state/tenant-group-exam-create.facade';

@Component({
  selector: 'app-tenant-group-exam-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-group-exam-create.component.html',
  styleUrl: './tenant-group-exam-create.component.css'})
export class TenantGroupExamCreateComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly facade = inject(TenantGroupExamCreateFacade);

  readonly groupId = this.facade.groupId;
  readonly isSubmitting = this.facade.isSubmitting;
  readonly groupContext = this.facade.groupContext;
  readonly isGroupContextLoading = this.facade.isGroupContextLoading;
  readonly groupContextError = this.facade.groupContextError;
  readonly publishedExamOptions = this.facade.publishedExamOptions;
  readonly examSearchQuery = this.facade.examSearchQuery;
  readonly isExamOptionsLoading = this.facade.isExamOptionsLoading;
  readonly examOptionsError = this.facade.examOptionsError;
  readonly previewExam = this.facade.previewExam;
  readonly previewQuestions = this.facade.previewQuestions;
  readonly isPreviewOpen = this.facade.isPreviewOpen;
  readonly isPreviewLoading = this.facade.isPreviewLoading;
  readonly previewError = this.facade.previewError;
  readonly examForm = this.facade.examForm;

  ngOnInit(): void {
    this.facade.initialize(
      this.route.snapshot.paramMap.get('id'),
      this.route.snapshot.queryParamMap.get('freshCreate') === 'true',
    );
  }

  ngOnDestroy(): void {
    this.facade.onDestroy(this.router.url);
  }

  onCancel(): void {
    this.facade.onCancel();
  }

  onSubmit(): void {
    this.facade.onSubmit();
  }

  onSelectExam(examId: string): void {
    const exam = this.facade.allPublishedExamOptions().find((option) => option.id === examId);
    if (exam) {
      this.facade.selectPublishedExam(exam);
    }
  }

  onSearchExams(event: Event): void {
    this.facade.setExamSearchQuery((event.target as HTMLInputElement).value);
  }

  onPreviewExam(examId: string): void {
    const exam = this.facade.allPublishedExamOptions().find((option) => option.id === examId);
    if (exam) {
      this.facade.openQuestionPreview(exam);
    }
  }

  onClosePreview(): void {
    this.facade.closeQuestionPreview();
  }

  onRetryPreview(): void {
    this.facade.retryQuestionPreview();
  }

  onRetryExamOptions(): void {
    this.facade.retryExamOptions();
  }
}
