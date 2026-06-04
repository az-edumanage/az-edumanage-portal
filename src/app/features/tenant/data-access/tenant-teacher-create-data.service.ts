import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  TenantTeacherCreatePayload,
  TenantTeacherEditSeed,
  TenantTeacherLookupData,
  TenantTeacherLookupGrade,
  TenantTeacherLookupStage,
  TenantTeacherLookupSubject,
  TenantTeacherUpdatePayload,
} from '../models/tenant-teacher-create.models';
import { Teacher } from '../models/tenant-teachers.models';

@Injectable({ providedIn: 'root' })
export class TenantTeacherCreateDataService {
  private readonly http = inject(HttpClient);
  private readonly teachersUrl = `${environment.apiBaseUrl}/tenant/teachers`;
  private readonly stagesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/stages`;
  private readonly gradesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/grades`;
  private readonly subjectsUrl = `${environment.apiBaseUrl}/tenant/platform-settings/subjects`;
  private readonly universitiesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/universities`;
  private readonly collegesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/colleges`;
  private readonly universitySubjectsUrl = `${environment.apiBaseUrl}/tenant/platform-settings/university-subjects`;

  getDefaultFormValue(): TenantTeacherCreatePayload {
    return {
      fullName: '',
      email: '',
      phone: '',
      username: '',
      password: 'Teacher123!',
      forcePasswordChange: true,
      educationCategory: 'BASIC_EDUCATION',
      stageIds: [],
      gradeIds: [],
      subjectIds: [],
      universityIds: [],
      collegeIds: [],
      universitySubjectIds: [],
      status: 'Active',
      joinDate: new Date().toISOString().split('T')[0],
      canManageAttendance: true,
      canManageExams: true,
      canMessageStudents: true,
      documents: [],
    };
  }

  loadLookups(): Observable<TenantTeacherLookupData> {
    return forkJoin({
      stages: this.http.get<TenantTeacherLookupStage[]>(this.stagesUrl),
      grades: this.http.get<TenantTeacherLookupGrade[]>(this.gradesUrl),
      subjects: this.http.get<TenantTeacherLookupSubject[]>(this.subjectsUrl),
      universities: this.http.get<TenantTeacherLookupData['universities']>(this.universitiesUrl),
      colleges: this.http.get<TenantTeacherLookupData['colleges']>(this.collegesUrl),
      universitySubjects: this.http.get<TenantTeacherLookupData['universitySubjects']>(this.universitySubjectsUrl),
    }).pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load teacher form data')));
  }

  getTeacherForEdit(teacherId: string): Observable<TenantTeacherEditSeed> {
    return this.http.get<Teacher>(`${this.teachersUrl}/${teacherId}`).pipe(
      map((teacher) => ({
        fullName: teacher.fullName || teacher.name,
        email: teacher.email,
        phone: teacher.phone ?? '',
        username: teacher.username,
        password: '',
        forcePasswordChange: true,
        educationCategory: teacher.educationCategory,
        stageIds: teacher.stageIds ?? [],
        gradeIds: teacher.gradeIds ?? [],
        subjectIds: teacher.subjectIds ?? [],
        universityIds: teacher.universityIds ?? [],
        collegeIds: teacher.collegeIds ?? [],
        universitySubjectIds: teacher.universitySubjectIds ?? [],
        status: teacher.status,
        joinDate: teacher.joinDate,
        canManageAttendance: teacher.canManageAttendance,
        canManageExams: teacher.canManageExams,
        canMessageStudents: teacher.canMessageStudents,
        documents: teacher.documents?.map((document) => ({
          fileName: document.fileName,
          contentType: document.contentType,
          sizeBytes: document.sizeBytes,
          storagePath: document.storagePath,
        })) ?? [],
      })),
      catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load teacher')),
    );
  }

  createOrUpdateTeacher(payload: TenantTeacherCreatePayload, teacherId: string | null): Observable<Teacher> {
    const request = this.normalizePayload(payload, !!teacherId);
    const source = teacherId
      ? this.http.put<Teacher>(`${this.teachersUrl}/${teacherId}`, request)
      : this.http.post<Teacher>(this.teachersUrl, request);
    return source.pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to save teacher')));
  }

  private normalizePayload(payload: TenantTeacherCreatePayload, isEditMode: boolean): TenantTeacherCreatePayload | TenantTeacherUpdatePayload {
    const normalized = {
      ...payload,
      stageIds: payload.educationCategory === 'BASIC_EDUCATION' ? payload.stageIds : [],
      gradeIds: payload.educationCategory === 'BASIC_EDUCATION' ? payload.gradeIds : [],
      subjectIds: payload.educationCategory === 'BASIC_EDUCATION' ? payload.subjectIds : [],
      universityIds: payload.educationCategory === 'UNIVERSITY_EDUCATION' ? payload.universityIds : [],
      collegeIds: payload.educationCategory === 'UNIVERSITY_EDUCATION' ? payload.collegeIds : [],
      universitySubjectIds: payload.educationCategory === 'UNIVERSITY_EDUCATION' ? payload.universitySubjectIds : [],
      documents: payload.documents ?? [],
    };
    if (isEditMode) {
      return {
        fullName: normalized.fullName,
        email: normalized.email,
        phone: normalized.phone,
        educationCategory: normalized.educationCategory,
        stageIds: normalized.stageIds,
        gradeIds: normalized.gradeIds,
        subjectIds: normalized.subjectIds,
        universityIds: normalized.universityIds,
        collegeIds: normalized.collegeIds,
        universitySubjectIds: normalized.universitySubjectIds,
        status: normalized.status,
        joinDate: normalized.joinDate,
        canManageAttendance: normalized.canManageAttendance,
        canManageExams: normalized.canManageExams,
        canMessageStudents: normalized.canMessageStudents,
        documents: normalized.documents,
      };
    }
    return normalized;
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
