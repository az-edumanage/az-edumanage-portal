import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  GroupDetails,
  GroupExamRow,
  GroupLesson,
  GroupLessonContent,
  GroupSessionPublication,
  GroupSessionLibraryContent,
  TenantGroupDetailsResponse,
  TenantGroupLessonContentResponse,
  TenantGroupLessonResponse,
  TenantGroupPublishedSessionContentResponse,
  TenantGroupSessionLibraryContentResponse,
  TenantGroupSessionPublicationResponse,
} from '../models/tenant-group-details.models';
import {
  TenantCurriculumMaterialFile,
  TenantCurriculumMaterialFolder,
  TenantCurriculumMaterialLink,
  TenantCurriculumMaterialNote,
} from '../models/tenant-subjects.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupDetailsDataService {
  private readonly http = inject(HttpClient);
  private readonly groupsUrl = `${environment.apiBaseUrl}/tenant/groups`;

  loadGroupById(id: string | null): Observable<GroupDetails> {
    const groupId = id?.trim();
    if (!groupId) {
      return throwError(() => new Error('Group is required'));
    }

    return this.http.get<TenantGroupDetailsResponse>(this.groupDetailsUrl(groupId)).pipe(
      map((response) => this.toGroupDetails(response)),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load group details')),
    );
  }

  groupDetailsUrl(id: string): string {
    return `${this.groupsUrl}/${encodeURIComponent(id)}`;
  }

  removeStudentFromGroup(groupId: string | null, studentId: string): Observable<void> {
    const selectedGroupId = groupId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    return this.http
      .delete<void>(
        `${this.groupDetailsUrl(selectedGroupId)}/enrollments/${encodeURIComponent(studentId)}`,
      )
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to exit group')));
  }

  loadGroupExams(groupId: string | null): Observable<GroupExamRow[]> {
    const selectedGroupId = groupId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    return this.http.get<GroupExamRow[]>(`${this.groupDetailsUrl(selectedGroupId)}/exams`).pipe(
      map((response) => (response ?? []).map((exam) => this.toGroupExamRow(exam))),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load exams')),
    );
  }

  unpublishGroupExam(groupId: string | null, assignmentId: string | null): Observable<void> {
    const selectedGroupId = groupId?.trim();
    const selectedAssignmentId = assignmentId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    if (!selectedAssignmentId) {
      return throwError(() => new Error('Exam assignment is required'));
    }
    return this.http
      .patch<void>(`${this.groupDetailsUrl(selectedGroupId)}/exams/${encodeURIComponent(selectedAssignmentId)}/unpublish`, {})
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to unpublish exam')));
  }

  deleteGroupExam(groupId: string | null, assignmentId: string | null): Observable<void> {
    const selectedGroupId = groupId?.trim();
    const selectedAssignmentId = assignmentId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    if (!selectedAssignmentId) {
      return throwError(() => new Error('Exam assignment is required'));
    }
    return this.http
      .delete<void>(`${this.groupDetailsUrl(selectedGroupId)}/exams/${encodeURIComponent(selectedAssignmentId)}`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to delete exam')));
  }

  loadGroupLessons(groupId: string | null, options: { sync?: boolean; sessionId?: string | null } = {}): Observable<GroupLesson[]> {
    const selectedGroupId = groupId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    let params = new HttpParams();
    if (options.sync === true) {
      params = params.set('sync', 'true');
    }
    if (options.sessionId?.trim()) {
      params = params.set('sessionId', options.sessionId.trim());
    }
    return this.http.get<TenantGroupLessonResponse[]>(`${this.groupDetailsUrl(selectedGroupId)}/lessons`, { params }).pipe(
      map((response) => response.map((lesson) => this.toGroupLesson(lesson))),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load lessons')),
    );
  }

  addGroupLesson(groupId: string | null, curriculumNodeId: string, options: { sessionId?: string | null } = {}): Observable<GroupLesson> {
    const selectedGroupId = groupId?.trim();
    const selectedNodeId = curriculumNodeId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    if (!selectedNodeId) {
      return throwError(() => new Error('Curriculum lesson is required'));
    }
    return this.http
      .post<TenantGroupLessonResponse>(`${this.groupDetailsUrl(selectedGroupId)}/lessons`, {
        curriculumNodeId: selectedNodeId,
        sessionId: options.sessionId?.trim() || null,
      })
      .pipe(
        map((response) => this.toGroupLesson(response)),
        catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to add lesson')),
      );
  }

  deleteGroupLesson(groupId: string | null, lessonId: string | null): Observable<void> {
    const selectedGroupId = groupId?.trim();
    const selectedLessonId = lessonId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    if (!selectedLessonId) {
      return throwError(() => new Error('Lesson is required'));
    }
    return this.http
      .delete<void>(`${this.groupDetailsUrl(selectedGroupId)}/lessons/${encodeURIComponent(selectedLessonId)}`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to remove lesson')));
  }

  updateGroupLessonCompletion(groupId: string | null, lessonId: string | null, completed: boolean): Observable<GroupLesson> {
    const selectedGroupId = groupId?.trim();
    const selectedLessonId = lessonId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    if (!selectedLessonId) {
      return throwError(() => new Error('Lesson is required'));
    }
    return this.http
      .patch<TenantGroupLessonResponse>(
        `${this.groupDetailsUrl(selectedGroupId)}/lessons/${encodeURIComponent(selectedLessonId)}/completion`,
        { completed },
      )
      .pipe(
        map((response) => this.toGroupLesson(response)),
        catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to update lesson completion')),
      );
  }

  loadGroupLessonContent(groupId: string | null, lessonId: string | null): Observable<GroupLessonContent[]> {
    const selectedGroupId = groupId?.trim();
    const selectedLessonId = lessonId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    if (!selectedLessonId) {
      return throwError(() => new Error('Lesson is required'));
    }
    return this.http.get<TenantGroupLessonContentResponse[]>(
      `${this.groupDetailsUrl(selectedGroupId)}/lessons/${encodeURIComponent(selectedLessonId)}/content`,
    ).pipe(
      map((response) => response.map((content) => this.toGroupLessonContent(content))),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load lesson content')),
    );
  }

  addGroupLessonContent(
    groupId: string | null,
    lessonId: string | null,
    payload: { curriculumNodeId: string; folderId: string; contentType: 'FILE' | 'NOTE' | 'LINK'; contentId: string },
  ): Observable<GroupLessonContent> {
    const selectedGroupId = groupId?.trim();
    const selectedLessonId = lessonId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    if (!selectedLessonId) {
      return throwError(() => new Error('Lesson is required'));
    }
    return this.http.post<TenantGroupLessonContentResponse>(
      `${this.groupDetailsUrl(selectedGroupId)}/lessons/${encodeURIComponent(selectedLessonId)}/content`,
      payload,
    ).pipe(
      map((response) => this.toGroupLessonContent(response)),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to insert content')),
    );
  }

  loadGroupSessionLibraryContent(groupId: string | null, sessionId: string | null): Observable<GroupSessionLibraryContent[]> {
    const selectedGroupId = groupId?.trim();
    const selectedSessionId = sessionId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    if (!selectedSessionId) {
      return throwError(() => new Error('Session is required'));
    }
    const params = new HttpParams().set('sessionId', selectedSessionId);
    return this.http.get<TenantGroupSessionLibraryContentResponse[]>(`${this.groupDetailsUrl(selectedGroupId)}/session-library-content`, { params }).pipe(
      map((response) => (response ?? []).map((content) => this.toGroupSessionLibraryContent(content))),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load library content')),
    );
  }

  addGroupSessionLibraryContent(
    groupId: string | null,
    payload: { sessionId: string | null; folderId: string; contentType: 'FILE' | 'NOTE' | 'LINK'; contentId: string },
  ): Observable<GroupSessionLibraryContent> {
    const selectedGroupId = groupId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    return this.http.post<TenantGroupSessionLibraryContentResponse>(
      `${this.groupDetailsUrl(selectedGroupId)}/session-library-content`,
      payload,
    ).pipe(
      map((response) => this.toGroupSessionLibraryContent(response)),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to insert library content')),
    );
  }

  deleteGroupSessionLibraryContent(groupId: string | null, contentId: string | null): Observable<void> {
    const selectedGroupId = groupId?.trim();
    const selectedContentId = contentId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    if (!selectedContentId) {
      return throwError(() => new Error('Library content is required'));
    }
    return this.http
      .delete<void>(`${this.groupDetailsUrl(selectedGroupId)}/session-library-content/${encodeURIComponent(selectedContentId)}`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to remove library content')));
  }

  updateGroupSessionLibraryContentCompletion(groupId: string | null, contentId: string | null, completed: boolean): Observable<GroupSessionLibraryContent> {
    const selectedGroupId = groupId?.trim();
    const selectedContentId = contentId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    if (!selectedContentId) {
      return throwError(() => new Error('Library content is required'));
    }
    return this.http
      .patch<TenantGroupSessionLibraryContentResponse>(
        `${this.groupDetailsUrl(selectedGroupId)}/session-library-content/${encodeURIComponent(selectedContentId)}/completion`,
        { completed },
      )
      .pipe(
        map((response) => this.toGroupSessionLibraryContent(response)),
        catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to update library content')),
      );
  }

  loadGroupSessionPublication(groupId: string | null, sessionId: string | null): Observable<GroupSessionPublication> {
    const selectedGroupId = groupId?.trim();
    const selectedSessionId = sessionId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    if (!selectedSessionId) {
      return throwError(() => new Error('Session is required'));
    }
    return this.http
      .get<TenantGroupSessionPublicationResponse>(
        `${this.groupDetailsUrl(selectedGroupId)}/sessions/${encodeURIComponent(selectedSessionId)}/publication`,
      )
      .pipe(
        map((response) => this.toGroupSessionPublication(response)),
        catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load session publication')),
      );
  }

  publishGroupSession(groupId: string | null, sessionId: string | null): Observable<GroupSessionPublication> {
    const selectedGroupId = groupId?.trim();
    const selectedSessionId = sessionId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    if (!selectedSessionId) {
      return throwError(() => new Error('Session is required'));
    }
    return this.http
      .post<TenantGroupSessionPublicationResponse>(
        `${this.groupDetailsUrl(selectedGroupId)}/sessions/${encodeURIComponent(selectedSessionId)}/publish`,
        {},
      )
      .pipe(
        map((response) => this.toGroupSessionPublication(response)),
        catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to publish session')),
      );
  }

  loadGroupLibraryFolders(groupId: string | null): Observable<TenantCurriculumMaterialFolder[]> {
    const selectedGroupId = groupId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    return this.http.get<TenantCurriculumMaterialFolder[]>(`${this.groupDetailsUrl(selectedGroupId)}/library/folders`).pipe(
      map((response) => (response ?? []).map((folder) => this.toMaterialFolder(folder))),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load library folders')),
    );
  }

  createGroupLibraryFolder(groupId: string | null, payload: { name: string; description?: string | null }): Observable<TenantCurriculumMaterialFolder> {
    const selectedGroupId = groupId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    return this.http.post<TenantCurriculumMaterialFolder>(`${this.groupDetailsUrl(selectedGroupId)}/library/folders`, payload).pipe(
      map((response) => this.toMaterialFolder(response)),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to create library folder')),
    );
  }

  loadGroupLibraryFiles(groupId: string | null, folderId: string): Observable<TenantCurriculumMaterialFile[]> {
    const selectedGroupId = groupId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    return this.http.get<TenantCurriculumMaterialFile[]>(`${this.groupDetailsUrl(selectedGroupId)}/library/folders/${encodeURIComponent(folderId)}/files`).pipe(
      map((response) => (response ?? []).map((file) => this.toMaterialFile(file))),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load library files')),
    );
  }

  uploadGroupLibraryFile(groupId: string | null, folderId: string, file: File): Observable<TenantCurriculumMaterialFile> {
    const selectedGroupId = groupId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    const body = new FormData();
    body.append('file', file);
    return this.http.post<TenantCurriculumMaterialFile>(`${this.groupDetailsUrl(selectedGroupId)}/library/folders/${encodeURIComponent(folderId)}/files`, body).pipe(
      map((response) => this.toMaterialFile(response)),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to upload file')),
    );
  }

  loadGroupLibraryNotes(groupId: string | null, folderId: string): Observable<TenantCurriculumMaterialNote[]> {
    const selectedGroupId = groupId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    return this.http.get<TenantCurriculumMaterialNote[]>(`${this.groupDetailsUrl(selectedGroupId)}/library/folders/${encodeURIComponent(folderId)}/notes`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load library notes')),
    );
  }

  createGroupLibraryNote(groupId: string | null, folderId: string, payload: { title: string; contentJson: string }): Observable<TenantCurriculumMaterialNote> {
    const selectedGroupId = groupId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    return this.http.post<TenantCurriculumMaterialNote>(`${this.groupDetailsUrl(selectedGroupId)}/library/folders/${encodeURIComponent(folderId)}/notes`, payload).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to create note')),
    );
  }

  updateGroupLibraryNote(groupId: string | null, folderId: string, noteId: string, payload: { title: string; contentJson: string }): Observable<TenantCurriculumMaterialNote> {
    const selectedGroupId = groupId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    return this.http.put<TenantCurriculumMaterialNote>(
      `${this.groupDetailsUrl(selectedGroupId)}/library/folders/${encodeURIComponent(folderId)}/notes/${encodeURIComponent(noteId)}`,
      payload,
    ).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to update note')),
    );
  }

  loadGroupLibraryLinks(groupId: string | null, folderId: string): Observable<TenantCurriculumMaterialLink[]> {
    const selectedGroupId = groupId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    return this.http.get<TenantCurriculumMaterialLink[]>(`${this.groupDetailsUrl(selectedGroupId)}/library/folders/${encodeURIComponent(folderId)}/links`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load library links')),
    );
  }

  createGroupLibraryLink(groupId: string | null, folderId: string, payload: { title: string; url: string }): Observable<TenantCurriculumMaterialLink> {
    const selectedGroupId = groupId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }
    return this.http.post<TenantCurriculumMaterialLink>(`${this.groupDetailsUrl(selectedGroupId)}/library/folders/${encodeURIComponent(folderId)}/links`, payload).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to create link')),
    );
  }

  private toGroupDetails(response: TenantGroupDetailsResponse): GroupDetails {
    return {
      id: response.id,
      name: response.name,
      subjectId: response.subjectId ?? null,
      educationCategory: response.educationCategory ?? null,
      stageId: response.stageId ?? null,
      stageName: response.stageName ?? null,
      gradeId: response.gradeId ?? null,
      gradeName: response.gradeName ?? null,
      subject: response.subject,
      teacher: response.teacher,
      room: response.room,
      schedule: response.schedule,
      capacity: response.capacity ?? 0,
      enrolled: response.enrolled,
      fees: response.pricePerStudent,
      status: response.status,
      pricePerStudent: response.pricePerStudent,
      avgAttendanceRate: response.avgAttendanceRate,
      absenceRate: response.absenceRate,
      attendanceAvailable: response.attendanceAvailable,
      monthlyRevenue: response.monthlyRevenue,
      currency: response.currency,
      startAt: response.startAt ?? null,
      duration: response.duration ?? null,
      daySchedules: response.daySchedules ?? {},
      scheduleDays: response.scheduleDays ?? [],
      calendarEvents: response.calendarEvents ?? [],
      students: (response.students ?? []).map((student) => ({
        id: student.id,
        name: student.name,
        email: student.email,
        barcodeNumber: student.barcodeNumber ?? student.barcode_number ?? null,
        attendanceRate: student.attendanceRate ?? 0,
        lastAttendance: student.lastAttendance,
        attendanceTime: student.attendanceTime ?? null,
        attendanceState: student.attendanceState ?? null,
        attendanceSource: student.attendanceSource ?? null,
      })),
    };
  }

  private toGroupLesson(response: TenantGroupLessonResponse): GroupLesson {
    return {
      id: response.id,
      curriculumNodeId: response.curriculumNodeId,
      title: response.title,
      path: response.path,
      description: response.description ?? null,
      completed: response.completed ?? false,
    };
  }

  private toGroupExamRow(response: GroupExamRow): GroupExamRow {
    return {
      id: response.id,
      groupId: response.groupId,
      examId: response.examId,
      title: response.title,
      status: response.status,
      date: response.date,
      startTime: response.startTime ?? null,
      duration: response.duration,
      questionCount: response.questionCount ?? null,
      instructions: response.instructions ?? null,
      updatedAt: response.updatedAt ?? null,
      settings: {
        showResultsImmediately: response.settings?.showResultsImmediately ?? false,
        allowRetakes: response.settings?.allowRetakes ?? false,
      },
    };
  }

  private toGroupLessonContent(response: TenantGroupLessonContentResponse): GroupLessonContent {
    return {
      id: response.id,
      curriculumNodeId: response.curriculumNodeId,
      curriculumNodeLabel: response.curriculumNodeLabel,
      folderId: response.folderId,
      folderName: response.folderName,
      contentType: response.contentType,
      contentId: response.contentId,
      title: response.title,
      url: this.mediaUrlToAbsolute(response.url) ?? response.url ?? null,
      fileContentType: response.fileContentType ?? null,
      sizeBytes: response.sizeBytes ?? null,
    };
  }

  private toGroupSessionLibraryContent(response: TenantGroupSessionLibraryContentResponse): GroupSessionLibraryContent {
    return {
      id: response.id,
      sessionId: response.sessionId,
      folderId: response.folderId,
      folderName: response.folderName,
      contentType: response.contentType,
      contentId: response.contentId,
      title: response.title,
      url: this.mediaUrlToAbsolute(response.url) ?? response.url ?? null,
      fileContentType: response.fileContentType ?? null,
      sizeBytes: response.sizeBytes ?? null,
      completed: response.completed ?? false,
    };
  }

  private toGroupSessionPublication(response: TenantGroupSessionPublicationResponse): GroupSessionPublication {
    return {
      id: response.id ?? null,
      groupId: response.groupId,
      sessionId: response.sessionId,
      published: response.published,
      publishedAt: response.publishedAt ?? null,
      mediaCount: response.mediaCount ?? response.media?.length ?? 0,
      media: (response.media ?? []).map((content) => this.toGroupPublishedSessionContent(content)),
    };
  }

  private toGroupPublishedSessionContent(response: TenantGroupPublishedSessionContentResponse) {
    return {
      source: response.source,
      lessonId: response.lessonId ?? null,
      lessonTitle: response.lessonTitle ?? null,
      folderId: response.folderId,
      folderName: response.folderName,
      contentType: response.contentType,
      contentId: response.contentId,
      title: response.title,
      url: this.mediaUrlToAbsolute(response.url) ?? response.url ?? null,
      fileContentType: response.fileContentType ?? null,
      sizeBytes: response.sizeBytes ?? null,
    };
  }

  private toMaterialFolder(folder: TenantCurriculumMaterialFolder): TenantCurriculumMaterialFolder {
    return {
      ...folder,
      description: folder.description ?? null,
      fileTypes: folder.fileTypes ?? [],
      filesCount: folder.filesCount ?? 0,
    };
  }

  private toMaterialFile(file: TenantCurriculumMaterialFile): TenantCurriculumMaterialFile {
    return {
      ...file,
      url: this.mediaUrlToAbsolute(file.url) ?? file.url,
      contentType: file.contentType ?? null,
      sizeBytes: file.sizeBytes ?? null,
    };
  }

  private handleError(error: HttpErrorResponse, fallback: string): Observable<never> {
    const message = this.extractApiMessage(error.error) ?? fallback;
    return throwError(() => new Error(message));
  }

  private extractApiMessage(error: unknown): string | null {
    if (typeof error === 'string' && error.trim()) {
      return error;
    }
    if (error && typeof error === 'object') {
      const candidate = error as { message?: unknown; details?: unknown };
      if (typeof candidate.message === 'string' && candidate.message.trim()) {
        return candidate.message;
      }
    }
    return null;
  }

  private mediaUrlToAbsolute(url: string | null | undefined): string | null {
    if (!url) {
      return null;
    }
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    const apiOrigin = environment.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
    return `${apiOrigin}${url.startsWith('/') ? url : `/${url}`}`;
  }
}
