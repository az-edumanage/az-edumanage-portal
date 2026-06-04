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
      birthDate: '',
      gender: 'Male',
      parentName: '',
      parentPhone: '',
      address: '',
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

  private normalizePayload(payload: TenantStudentCreatePayload): TenantStudentCreatePayload {
    return {
      ...payload,
      stageIds: payload.educationCategory === 'BASIC_EDUCATION' ? payload.stageIds : [],
      gradeIds: payload.educationCategory === 'BASIC_EDUCATION' ? payload.gradeIds : [],
      universityIds: payload.educationCategory === 'UNIVERSITY_EDUCATION' ? payload.universityIds : [],
      collegeIds: payload.educationCategory === 'UNIVERSITY_EDUCATION' ? payload.collegeIds : [],
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
