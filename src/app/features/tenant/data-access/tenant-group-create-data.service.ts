import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  RoomAvailabilityResponse,
  TenantGroupCreateApiPayload,
  TenantGroupCreateOptions,
  TenantGroupEditApiPayload,
  TenantGroupEducationCategory,
  TenantGroupSelectorOption,
  TenantGroupTeacherClassificationOptions,
  TeacherAvailabilityResponse,
} from '../models/tenant-group-create.models';
import { Group } from '../models/tenant-groups.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupCreateDataService {
  private readonly http = inject(HttpClient);
  private readonly groupsUrl = `${environment.apiBaseUrl}/tenant/groups`;

  loadCreateOptions(): Observable<TenantGroupCreateOptions> {
    return this.http
      .get<TenantGroupCreateOptions>(`${this.groupsUrl}/create-options`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load group form data')));
  }

  loadSubjects(params: {
    educationCategory: TenantGroupEducationCategory;
    stageId?: string;
    gradeId?: string;
    universityId?: string;
    collegeId?: string;
  }): Observable<TenantGroupSelectorOption[]> {
    let httpParams = new HttpParams().set('educationCategory', params.educationCategory);
    if (params.stageId) httpParams = httpParams.set('stageId', params.stageId);
    if (params.gradeId) httpParams = httpParams.set('gradeId', params.gradeId);
    if (params.universityId) httpParams = httpParams.set('universityId', params.universityId);
    if (params.collegeId) httpParams = httpParams.set('collegeId', params.collegeId);
    return this.http
      .get<TenantGroupSelectorOption[]>(`${this.groupsUrl}/subjects`, { params: httpParams })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load subjects')));
  }

  loadAssignedTeachers(params: {
    educationCategory: TenantGroupEducationCategory;
    stageId?: string;
    gradeId?: string;
    subjectId?: string;
    universityId?: string;
    collegeId?: string;
    universitySubjectId?: string;
  }): Observable<TenantGroupSelectorOption[]> {
    let httpParams = new HttpParams().set('educationCategory', params.educationCategory);
    if (params.stageId) httpParams = httpParams.set('stageId', params.stageId);
    if (params.gradeId) httpParams = httpParams.set('gradeId', params.gradeId);
    if (params.subjectId) httpParams = httpParams.set('subjectId', params.subjectId);
    if (params.universityId) httpParams = httpParams.set('universityId', params.universityId);
    if (params.collegeId) httpParams = httpParams.set('collegeId', params.collegeId);
    if (params.universitySubjectId) httpParams = httpParams.set('universitySubjectId', params.universitySubjectId);
    return this.http
      .get<TenantGroupSelectorOption[]>(`${this.groupsUrl}/assigned-teachers`, { params: httpParams })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load assigned teachers')));
  }

  loadTeacherClassification(params: {
    educationCategory: TenantGroupEducationCategory;
    teacherId: string;
  }): Observable<TenantGroupTeacherClassificationOptions> {
    const httpParams = new HttpParams()
      .set('educationCategory', params.educationCategory)
      .set('teacherId', params.teacherId);
    return this.http
      .get<TenantGroupTeacherClassificationOptions>(`${this.groupsUrl}/teacher-classification`, { params: httpParams })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load teacher academic data')));
  }

  loadTeacherAvailability(teacherId: string, excludeGroupId?: string | null): Observable<TeacherAvailabilityResponse> {
    let httpParams = new HttpParams().set('teacherId', teacherId);
    if (excludeGroupId) httpParams = httpParams.set('excludeGroupId', excludeGroupId);
    return this.http
      .get<TeacherAvailabilityResponse>(`${this.groupsUrl}/teacher-availability`, { params: httpParams })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load teacher availability')));
  }

  loadRoomAvailability(excludeGroupId?: string | null): Observable<RoomAvailabilityResponse> {
    let httpParams = new HttpParams();
    if (excludeGroupId) httpParams = httpParams.set('excludeGroupId', excludeGroupId);
    return this.http
      .get<RoomAvailabilityResponse>(`${this.groupsUrl}/room-availability`, { params: httpParams })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load room availability')));
  }

  loadGroupForEdit(groupId: string): Observable<TenantGroupEditApiPayload> {
    return this.http
      .get<TenantGroupEditApiPayload>(`${this.groupsUrl}/${groupId}/edit`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load group')));
  }

  createOrUpdateGroup(payload: TenantGroupCreateApiPayload, groupId?: string | null): Observable<Group> {
    if (groupId) {
      return this.http
        .put<Group>(`${this.groupsUrl}/${groupId}`, payload)
        .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to save group')));
    }

    return this.http
      .post<Group>(this.groupsUrl, payload)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to save group')));
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
      if (Array.isArray(candidate.details) && candidate.details.length > 0) {
        const details = candidate.details.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
        if (details.length > 0) {
          return details.join(', ');
        }
      }
      if (typeof candidate.message === 'string' && candidate.message.trim()) {
        return candidate.message;
      }
    }
    return null;
  }
}
