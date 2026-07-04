import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  GroupExamAssignment,
  GroupExamAssignmentPayload,
  GroupExamPreviewQuestion,
  PublishedGroupExamOption,
} from '../models/tenant-group-exam-create.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupExamCreateDataService {
  private readonly http = inject(HttpClient);
  private readonly groupsUrl = `${environment.apiBaseUrl}/tenant/groups`;
  private readonly teacherGroupsUrl = `${environment.apiBaseUrl}/teacher/groups`;
  private readonly examsUrl = `${environment.apiBaseUrl}/tenant/platform-settings/exams/basic-education`;
  private readonly teacherExamsUrl = `${environment.apiBaseUrl}/tenant/platform-settings/exams/basic-education`;

  loadGroupExamAssignment(groupId: string | null, options: { scope?: 'tenant' | 'teacher' } = {}): Observable<GroupExamAssignment> {
    const selectedGroupId = this.requireId(groupId, 'Group is required');
    return this.http
      .get<GroupExamAssignment>(`${this.groupUrl(selectedGroupId, options.scope)}/exam`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load group exam')));
  }

  saveGroupExamAssignment(
    groupId: string | null,
    payload: GroupExamAssignmentPayload,
    options: { scope?: 'tenant' | 'teacher' } = {},
  ): Observable<GroupExamAssignment> {
    const selectedGroupId = this.requireId(groupId, 'Group is required');
    return this.http
      .put<GroupExamAssignment>(`${this.groupUrl(selectedGroupId, options.scope)}/exam`, payload)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to save group exam')));
  }

  loadPublishedExamOptions(
    stageId: string | null,
    gradeId: string | null,
    subjectId: string | null,
    options: { scope?: 'tenant' | 'teacher' } = {},
  ): Observable<PublishedGroupExamOption[]> {
    const selectedStageId = this.requireId(stageId, 'Stage is required');
    const selectedGradeId = this.requireId(gradeId, 'Grade is required');
    const selectedSubjectId = this.requireId(subjectId, 'Subject is required');
    const params = new HttpParams().set('status', 'PUBLISHED');
    return this.http
      .get<PublishedGroupExamOption[]>(
        `${this.examsUrlForScope(options.scope)}/${encodeURIComponent(selectedStageId)}/grades/${encodeURIComponent(selectedGradeId)}/subjects/${encodeURIComponent(selectedSubjectId)}`,
        { params },
      )
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load published exams')));
  }

  loadExamQuestions(
    stageId: string | null | undefined,
    gradeId: string | null | undefined,
    subjectId: string | null | undefined,
    examId: string | null | undefined,
    options: { scope?: 'tenant' | 'teacher' } = {},
  ): Observable<GroupExamPreviewQuestion[]> {
    const selectedStageId = this.requireId(stageId, 'Stage is required');
    const selectedGradeId = this.requireId(gradeId, 'Grade is required');
    const selectedSubjectId = this.requireId(subjectId, 'Subject is required');
    const selectedExamId = this.requireId(examId, 'Exam is required');
    return this.http
      .get<GroupExamPreviewQuestion[]>(
        `${this.examsUrlForScope(options.scope)}/${encodeURIComponent(selectedStageId)}/grades/${encodeURIComponent(selectedGradeId)}/subjects/${encodeURIComponent(selectedSubjectId)}/${encodeURIComponent(selectedExamId)}/questions`,
      )
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load exam questions')));
  }

  private groupUrl(groupId: string, scope: 'tenant' | 'teacher' = 'tenant'): string {
    const baseUrl = scope === 'teacher' ? this.teacherGroupsUrl : this.groupsUrl;
    return `${baseUrl}/${encodeURIComponent(groupId)}`;
  }

  private examsUrlForScope(scope: 'tenant' | 'teacher' = 'tenant'): string {
    return scope === 'teacher' ? this.teacherExamsUrl : this.examsUrl;
  }

  private requireId(value: string | null | undefined, message: string): string {
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new Error(message);
    }
    return trimmed;
  }

  private handleError(error: HttpErrorResponse, fallback: string): Observable<never> {
    const message = typeof error.error === 'string' && error.error.trim()
      ? error.error
      : error.error?.message || fallback;
    return throwError(() => new Error(message));
  }
}
