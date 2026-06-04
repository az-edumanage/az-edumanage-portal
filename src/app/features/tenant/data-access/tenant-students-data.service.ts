import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Student, StudentDetails, StudentScheduleRow, StudentScheduleSummary, TenantStudentBackendRecord } from '../models/tenant-students.models';

@Injectable({ providedIn: 'root' })
export class TenantStudentsDataService {
  private readonly http = inject(HttpClient);
  private readonly studentsUrl = `${environment.apiBaseUrl}/tenant/students`;

  loadStudents(): Observable<Student[]> {
    return this.http
      .get<TenantStudentBackendRecord[]>(this.studentsUrl)
      .pipe(
        map((records) => records.map((record) => this.toStudent(record))),
        catchError((error: HttpErrorResponse) => this.handleError(error)),
      );
  }

  getStudent(id: string): Observable<StudentDetails> {
    return this.http.get<TenantStudentBackendRecord>(`${this.studentsUrl}/${id}`).pipe(
      map((record) => this.toStudentDetails(record)),
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  private toStudent(record: TenantStudentBackendRecord): Student {
    return {
      id: record.id,
      name: record.fullName,
      email: record.email,
      grade: this.toEducationLabel(record.educationCategory),
      status: 'Active',
      enrollmentDate: this.toEnrollmentDate(record.createdAt),
    };
  }

  private toStudentDetails(record: TenantStudentBackendRecord): StudentDetails {
    return {
      ...this.toStudent(record),
      phone: record.phone ?? '',
      barcodeNumber: record.barcodeNumber ?? record.barcode_number ?? '',
      gender: record.gender ?? '',
      birthDate: this.toFullDate(record.birthDate ?? null),
      parentName: record.parentName ?? '',
      parentPhone: record.parentPhone ?? '',
      address: record.address ?? '',
      notifyParent: Boolean(record.notifyParent),
      educationCategory: this.toEducationLabel(record.educationCategory),
      scheduleSummary: this.toScheduleSummary(record.scheduleSummary),
      scheduleRows: this.toScheduleRows(record.scheduleRows),
    };
  }

  private toEducationLabel(category: string | null): string {
    if (category === 'BASIC_EDUCATION') {
      return 'Basic Education';
    }
    if (category === 'UNIVERSITY_EDUCATION') {
      return 'University Education';
    }
    return 'Education';
  }

  private toEnrollmentDate(value: string | null): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  private toFullDate(value: string | null): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private toScheduleSummary(summary: StudentScheduleSummary | null | undefined): StudentScheduleSummary {
    return {
      attendanceLabel: summary?.attendanceLabel ?? '0%',
      attendanceProgress: this.clampProgress(summary?.attendanceProgress ?? 0),
      scheduleDaysCount: summary?.scheduleDaysCount ?? 0,
      totalGroups: summary?.totalGroups ?? 0,
      groupsCount: summary?.groupsCount ?? 0,
    };
  }

  private toScheduleRows(rows: StudentScheduleRow[] | null | undefined): StudentScheduleRow[] {
    return (rows ?? []).map((row) => ({
      groupId: row.groupId ?? null,
      group: row.group ?? '',
      day: row.day ?? '',
      time: row.time ?? '',
      roomId: row.roomId ?? null,
      room: row.room ?? '',
      teacherId: row.teacherId ?? null,
      teacher: row.teacher ?? '',
    }));
  }

  private clampProgress(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
    return Math.min(100, Math.max(0, value));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message = this.extractApiMessage(error.error) ?? 'Unable to load students';
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
