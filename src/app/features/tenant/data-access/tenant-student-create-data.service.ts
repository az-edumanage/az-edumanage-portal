import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  TenantStudentCreatePayload,
  TenantStudentCreateResponse,
  TenantStudentLookupData,
} from '../models/tenant-student-create.models';

@Injectable({ providedIn: 'root' })
export class TenantStudentCreateDataService {
  private readonly http = inject(HttpClient);
  private readonly studentsUrl = `${environment.apiBaseUrl}/tenant/students`;

  getDefaultFormValue(): TenantStudentCreatePayload {
    return {
      fullName: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      birthDate: '',
      gender: 'Male',
      parentAppUserId: '',
      notifyParent: true,
      educationCategory: 'BASIC_EDUCATION',
      stageIds: [],
      gradeIds: [],
      universityIds: [],
      collegeIds: [],
    };
  }

  loadLookups(): Observable<TenantStudentLookupData> {
    return this.http
      .get<TenantStudentLookupData>(`${this.studentsUrl}/create-lookups`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load student form data')));
  }

  enrollStudent(payload: TenantStudentCreatePayload): Observable<void> {
    return this.http
      .post<TenantStudentCreateResponse>(this.studentsUrl, this.normalizePayload(payload))
      .pipe(
        map(() => void 0),
        catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to enroll student')),
      );
  }

  loadStudentForEdit(studentId: string): Observable<TenantStudentCreatePayload> {
    return this.http
      .get<TenantStudentCreateResponse & Partial<TenantStudentCreatePayload> & {
        fullName: string;
        birthDate: string;
        stageIds?: string[] | null;
        gradeIds?: string[] | null;
        universityIds?: string[] | null;
        collegeIds?: string[] | null;
      }>(`${this.studentsUrl}/${studentId}`)
      .pipe(
        map((student) => ({
          ...this.getDefaultFormValue(),
          fullName: student.fullName ?? '',
          email: student.email ?? '',
          phone: student.phone ?? '',
          username: '',
          password: '',
          birthDate: this.toDateInputValue(student.birthDate),
          gender: student.gender ?? 'Male',
          parentAppUserId: student.parentAppUserId ?? '',
          notifyParent: student.notifyParent ?? true,
          educationCategory: student.educationCategory ?? 'BASIC_EDUCATION',
          stageIds: student.stageIds ?? [],
          gradeIds: student.gradeIds ?? [],
          universityIds: student.universityIds ?? [],
          collegeIds: student.collegeIds ?? [],
        })),
        catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to load student')),
      );
  }

  updateStudent(studentId: string, payload: TenantStudentCreatePayload): Observable<void> {
    return this.http
      .put<TenantStudentCreateResponse>(`${this.studentsUrl}/${studentId}`, this.normalizeUpdatePayload(payload))
      .pipe(
        map(() => void 0),
        catchError((error: HttpErrorResponse) => this.handleError(error, 'Unable to update student')),
      );
  }

  private normalizePayload(payload: TenantStudentCreatePayload): TenantStudentCreatePayload {
    return {
      ...payload,
      email: this.normalizeOptional(payload.email),
      phone: this.normalizeOptional(payload.phone),
      username: payload.username.trim(),
      parentAppUserId: payload.parentAppUserId?.trim() ?? '',
      stageIds: payload.educationCategory === 'BASIC_EDUCATION' ? payload.stageIds : [],
      gradeIds: payload.educationCategory === 'BASIC_EDUCATION' ? payload.gradeIds : [],
      universityIds: payload.educationCategory === 'UNIVERSITY_EDUCATION' ? payload.universityIds : [],
      collegeIds: payload.educationCategory === 'UNIVERSITY_EDUCATION' ? payload.collegeIds : [],
    };
  }

  private normalizeUpdatePayload(payload: TenantStudentCreatePayload): Omit<TenantStudentCreatePayload, 'username' | 'password'> {
    const normalized = this.normalizePayload(payload);
    const {
      username: _username,
      password: _password,
      ...updatePayload
    } = normalized;
    return updatePayload;
  }

  private toDateInputValue(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    return value.includes('T') ? value.slice(0, 10) : value;
  }

  private normalizeOptional(value: string | null): string | null {
    const normalized = value?.trim() ?? '';
    return normalized ? normalized : null;
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
