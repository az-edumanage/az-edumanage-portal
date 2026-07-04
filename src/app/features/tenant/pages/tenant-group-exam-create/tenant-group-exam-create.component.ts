import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, ActivatedRoute, Router } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TenantGroupExamCreateFacade } from "../../state/tenant-group-exam-create.facade";

@Component({
  selector: "app-tenant-group-exam-create",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: "./tenant-group-exam-create.component.html",
  styleUrl: "./tenant-group-exam-create.component.css",
})
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
  readonly isTeacherScope = this.route.snapshot.data["scope"] === "teacher";
  readonly groupListRoute = this.isTeacherScope
    ? "/teacher/groups"
    : "/tenant/groups";
  readonly isSessionHomeWork =
    Boolean(
      this.route.snapshot.queryParamMap.get("returnTo")?.includes("/sessions/"),
    ) ||
    Boolean(
      this.route.snapshot.queryParamMap.get("examDate") ||
      this.route.snapshot.queryParamMap.get("examStartTime"),
    );
  get assignmentContextLabel(): string {
    return this.isSessionHomeWork ? "Session Home Work" : "Group Exam";
  }
  get detailsPanelTitle(): string {
    return this.isSessionHomeWork ? "Home Work Details" : "Exam Details";
  }
  get titleFieldLabel(): string {
    return this.isSessionHomeWork ? "Home Work Title" : "Exam Title";
  }
  get dateFieldLabel(): string {
    return this.isSessionHomeWork ? "Home Work Date" : "Exam Date";
  }
  get sourcePanelTitle(): string {
    return this.isSessionHomeWork ? "Published Exams" : "Exams";
  }
  get submitLabel(): string {
    return this.isSessionHomeWork ? "Assign Home Work" : "Create & Publish";
  }
  get submittingLabel(): string {
    return this.isSessionHomeWork ? "Assigning..." : "Creating...";
  }

  ngOnInit(): void {
    this.facade.initialize(
      this.route.snapshot.paramMap.get("id"),
      this.route.snapshot.queryParamMap.get("freshCreate") === "true",
      {
        scope:
          this.route.snapshot.data["scope"] === "teacher"
            ? "teacher"
            : "tenant",
        returnTo: this.route.snapshot.queryParamMap.get("returnTo"),
        returnTab: this.route.snapshot.queryParamMap.get("returnTab"),
        assignmentId: this.route.snapshot.queryParamMap.get("assignmentId"),
        examDate: this.route.snapshot.queryParamMap.get("examDate"),
        examStartTime: this.route.snapshot.queryParamMap.get("examStartTime"),
      },
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
    const exam = this.facade
      .allPublishedExamOptions()
      .find((option) => option.id === examId);
    if (exam) {
      this.facade.selectPublishedExam(exam);
    }
  }

  onSearchExams(event: Event): void {
    this.facade.setExamSearchQuery((event.target as HTMLInputElement).value);
  }

  onPreviewExam(examId: string): void {
    const exam = this.facade
      .allPublishedExamOptions()
      .find((option) => option.id === examId);
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
