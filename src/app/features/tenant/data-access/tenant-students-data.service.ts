import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EducationalStage } from '../models/tenant-educational-stages.models';
import { Grade } from '../models/tenant-grades.models';
import {
  Student,
  StudentAttendanceSummary,
  StudentCapacity,
  StudentDetails,
  StudentScheduleRow,
  StudentScheduleSummary,
  TenantParent,
  TenantParentCreatePayload,
  TenantParentUpdatePayload,
  TenantStudentBackendRecord,
} from '../models/tenant-students.models';

interface StudentEducationLookup {
  gradesById: Map<string, Grade>;
  stagesById: Map<string, EducationalStage>;
}

interface AssignedEducationLabel {
  grade: string;
  gradeId?: string;
  stage: string;
  stageId?: string;
}

@Injectable({ providedIn: 'root' })
export class TenantStudentsDataService {
  private readonly http = inject(HttpClient);
  private readonly studentsUrl = `${environment.apiBaseUrl}/tenant/students`;
  private readonly parentsUrl = `${environment.apiBaseUrl}/tenant/parents`;
  private readonly gradesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/grades`;
  private readonly stagesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/stages`;

  loadStudents(): Observable<Student[]> {
    return this.http
      .get<TenantStudentBackendRecord[]>(this.studentsUrl)
      .pipe(
        switchMap((records) => this.toStudentsWithAssignedEducation(records ?? [])),
        catchError((error: HttpErrorResponse) => this.handleError(error)),
      );
  }

  capacity(): Observable<StudentCapacity> {
    return this.http
      .get<StudentCapacity>(`${this.studentsUrl}/capacity`, { params: { _: Date.now().toString() } })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  loadParents(): Observable<TenantParent[]> {
    return this.http
      .get<TenantParent[]>(this.parentsUrl)
      .pipe(
        map((parents) => (parents ?? []).map((parent) => this.normalizeParent(parent))),
        catchError((error: HttpErrorResponse) => this.handleError(error)),
      );
  }

  createParent(payload: TenantParentCreatePayload): Observable<TenantParent> {
    return this.http.post<TenantParent>(this.parentsUrl, payload).pipe(
      map((parent) => this.normalizeParent(parent)),
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  updateParent(parentUserId: string, payload: TenantParentUpdatePayload): Observable<TenantParent> {
    return this.http.put<TenantParent>(`${this.parentsUrl}/${parentUserId}`, payload).pipe(
      map((parent) => this.normalizeParent(parent)),
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  deleteParent(parentUserId: string): Observable<void> {
    return this.http.delete<void>(`${this.parentsUrl}/${parentUserId}`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  loadAttendanceSummary(): Observable<StudentAttendanceSummary> {
    return this.http
      .get<StudentAttendanceSummary>(`${this.studentsUrl}/attendance-summary`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  getStudent(id: string): Observable<StudentDetails> {
    return this.http.get<TenantStudentBackendRecord>(`${this.studentsUrl}/${id}`).pipe(
      switchMap((record) => {
        if (!this.needsEducationLookup(record)) {
          return of(this.toStudentDetails(record));
        }
        return forkJoin({
          grades: this.http.get<Grade[]>(this.gradesUrl),
          stages: this.http.get<EducationalStage[]>(this.stagesUrl),
        }).pipe(
          map(({ grades, stages }) => this.toStudentDetails(record, this.toEducationLookup(grades ?? [], stages ?? []))),
        );
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  deleteStudent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.studentsUrl}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  changeStudentPassword(studentId: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.studentsUrl}/${studentId}/password`, { newPassword }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  changeParentPassword(parentUserId: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.parentsUrl}/${parentUserId}/password`, { newPassword }).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  private normalizeParent(parent: TenantParent): TenantParent {
    return {
      ...parent,
      appUserId: parent.appUserId ?? parent.id,
      phone: parent.phone ?? '',
      email: parent.email ?? '',
      students: parent.students ?? [],
    };
  }

  private toStudentsWithAssignedEducation(records: TenantStudentBackendRecord[]): Observable<Student[]> {
    if (records.length === 0) {
      return of([]);
    }
    if (!records.some((record) => this.needsEducationLookup(record))) {
      return of(records.map((record) => this.toStudent(record)));
    }
    return forkJoin({
      grades: this.http.get<Grade[]>(this.gradesUrl),
      stages: this.http.get<EducationalStage[]>(this.stagesUrl),
    }).pipe(
      map(({ grades, stages }) => {
        const lookup = this.toEducationLookup(grades ?? [], stages ?? []);
        return records.map((record) => this.toStudent(record, lookup));
      }),
    );
  }

  private toParentsWithAssignedEducation(records: TenantStudentBackendRecord[]): Observable<TenantParent[]> {
    if (records.length === 0) {
      return of([]);
    }
    if (!records.some((record) => this.needsEducationLookup(record))) {
      return of(this.toParents(records));
    }
    return forkJoin({
      grades: this.http.get<Grade[]>(this.gradesUrl),
      stages: this.http.get<EducationalStage[]>(this.stagesUrl),
    }).pipe(
      map(({ grades, stages }) => this.toParents(records, this.toEducationLookup(grades ?? [], stages ?? []))),
    );
  }

  private toParents(records: TenantStudentBackendRecord[], lookup?: StudentEducationLookup): TenantParent[] {
    const parentsByKey = new Map<string, TenantParent>();
    for (const record of records) {
      const parentName = (record.parentName ?? '').trim();
      const parentPhone = (record.parentPhone ?? '').trim();
      if (!parentName && !parentPhone) {
        continue;
      }
      const parentAppUserId = record.parentAppUserId?.trim() || null;
      const key = parentAppUserId ?? `${parentName.toLowerCase()}|${parentPhone.toLowerCase()}`;
      const existing = parentsByKey.get(key);
      const student = this.toStudent(record, lookup);
      const parent = existing ?? {
        id: parentAppUserId ?? this.toParentId(parentName, parentPhone),
        appUserId: parentAppUserId,
        name: parentName || 'Unnamed parent',
        phone: parentPhone,
        notifyParent: false,
        students: [],
      };
      parent.notifyParent = parent.notifyParent || Boolean(record.notifyParent);
      if (!parent.students.some((linkedStudent) => linkedStudent.id === student.id)) {
        parent.students.push({
          id: student.id,
          name: student.name,
          grade: student.grade,
        });
      }
      parentsByKey.set(key, parent);
    }
    return [...parentsByKey.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  private toStudent(record: TenantStudentBackendRecord, lookup?: StudentEducationLookup): Student {
    const education = this.toAssignedEducationLabel(record, lookup);
    const student: Student = {
      id: record.id,
      name: record.fullName,
      email: record.email ?? '',
      grade: education.grade,
      stage: education.stage,
      status: 'Active',
      enrollmentDate: this.toEnrollmentDate(record.createdAt),
    };
    if (education.gradeId) {
      student.gradeId = education.gradeId;
    }
    if (education.stageId) {
      student.stageId = education.stageId;
    }
    return student;
  }

  private toParentId(name: string, phone: string): string {
    return btoa(unescape(encodeURIComponent(`${name}|${phone}`)))
      .replace(/=+$/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private toStudentDetails(record: TenantStudentBackendRecord, lookup?: StudentEducationLookup): StudentDetails {
    return {
      ...this.toStudent(record, lookup),
      studentUsername: record.studentUsername ?? '',
      phone: record.phone ?? '',
      barcodeNumber: record.barcodeNumber ?? record.barcode_number ?? '',
      gender: record.gender ?? '',
      birthDate: this.toFullDate(record.birthDate ?? null),
      parentUsername: record.parentUsername ?? '',
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

  private toAssignedEducationLabel(record: TenantStudentBackendRecord, lookup?: StudentEducationLookup): AssignedEducationLabel {
    const grade = this.lookupAssignedGrade(record, lookup);
    const gradeId = record.gradeIds?.find((id) => id?.trim()) ?? grade?.id;
    const gradeName = record.gradeName ?? record.grade_name ?? record.gradeNames?.find((name) => name?.trim()) ?? grade?.name;
    const stage = this.lookupAssignedStage(record, grade, lookup);
    const stageId = record.stageIds?.find((id) => id?.trim()) ?? stage?.id;
    const stageName =
      record.stageName ??
      record.stage_name ??
      record.stageNames?.find((name) => name?.trim()) ??
      stage?.name;
    const resolvedGrade = gradeName?.trim();
    const resolvedStage = stageName?.trim();
    if (resolvedGrade) {
      return {
        grade: resolvedGrade,
        gradeId,
        stage: resolvedStage && resolvedStage.toLowerCase() !== resolvedGrade.toLowerCase() ? resolvedStage : '',
        stageId,
      };
    }
    if (resolvedStage) {
      return {
        grade: resolvedStage,
        gradeId,
        stage: '',
        stageId,
      };
    }
    return {
      grade: this.toEducationLabel(record.educationCategory),
      gradeId,
      stage: '',
      stageId,
    };
  }

  private needsEducationLookup(record: TenantStudentBackendRecord): boolean {
    const hasResolvedGrade = Boolean((record.gradeName ?? record.grade_name ?? record.gradeNames?.find((name) => name?.trim()))?.trim());
    const hasResolvedStage = Boolean((record.stageName ?? record.stage_name ?? record.stageNames?.find((name) => name?.trim()))?.trim());
    return Boolean(record.gradeIds?.length && !hasResolvedGrade) || Boolean(record.stageIds?.length && !hasResolvedStage);
  }

  private toEducationLookup(grades: Grade[], stages: EducationalStage[]): StudentEducationLookup {
    return {
      gradesById: new Map(grades.map((grade) => [grade.id, grade])),
      stagesById: new Map(stages.map((stage) => [stage.id, stage])),
    };
  }

  private lookupAssignedGrade(record: TenantStudentBackendRecord, lookup?: StudentEducationLookup): Grade | undefined {
    const gradeId = record.gradeIds?.find((id) => id?.trim());
    return gradeId ? lookup?.gradesById.get(gradeId) : undefined;
  }

  private lookupAssignedStage(
    record: TenantStudentBackendRecord,
    grade: Grade | undefined,
    lookup?: StudentEducationLookup
  ): EducationalStage | undefined {
    const stageId = record.stageIds?.find((id) => id?.trim()) ?? grade?.stageId;
    return stageId ? lookup?.stagesById.get(stageId) : undefined;
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
