import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  TenantAttendanceStudent,
  TenantBarcodeAttendanceScanRequest,
  TenantBarcodeAttendanceScanResponse,
  TenantManualAttendanceRequest,
  TenantManualAttendanceResponse,
} from '../models/tenant-group-attendance.models';
import { TenantGroupDetailsResponse, TenantGroupStudentResponse } from '../models/tenant-group-details.models';
import { TenantStudentBackendRecord } from '../models/tenant-students.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupAttendanceDataService {
  private readonly http = inject(HttpClient);
  private readonly groupsUrl = `${environment.apiBaseUrl}/tenant/groups`;
  private readonly studentsUrl = `${environment.apiBaseUrl}/tenant/students`;
  private readonly attendanceUrl = `${environment.apiBaseUrl}/tenant/attendance`;

  private readonly mockStudentsByGroupId = new Map<string, TenantAttendanceStudent[]>([
    [
      'g-1',
      [
        this.createStudent('1', 'Ahmed Ali', true, 'RFID-10001', '10001', 98, 20, 19),
        this.createStudent('2', 'Sara Mohamed', true, 'RFID-10002', '10002', 92, 20, 18),
        this.createStudent('3', 'Omar Hassan', false, 'RFID-10003', '10003', 85, 20, 17),
        this.createStudent('4', 'Laila Mahmoud', true, 'RFID-10004', '10004', 100, 20, 20),
        this.createStudent('5', 'Youssef Ibrahim', false, 'RFID-10005', '10005', 78, 20, 15),
      ],
    ],
    [
      'english-g9-a',
      [
        this.createStudent('english-g9-a-1', 'Ahmed Ali', false, 'RFID-20001', '20001', 90, 18, 16),
        this.createStudent('english-g9-a-2', 'Sara Mohamed', false, null, '20002', 88, 18, 15),
      ],
    ],
    [
      'physics-g11-c',
      [
        this.createStudent('physics-g11-c-1', 'Omar Hassan', false, 'RFID-30001', null, 82, 16, 13),
        this.createStudent('physics-g11-c-2', 'Laila Mahmoud', false, 'RFID-30002', '30002', 94, 16, 15),
      ],
    ],
    [
      'arabic-11-30',
      [
        this.createStudent('arabic-11-30-1', 'Hussein Adel', false, 'RFID-11301', '11301', 86, 14, 12),
        this.createStudent('arabic-11-30-2', 'Mariam Samir', false, null, '11302', 91, 14, 13),
      ],
    ],
    [
      'algebra-11-30',
      [this.createStudent('algebra-11-30-1', 'Nour Khaled', false, 'RFID-11311', '11311', 79, 14, 11)],
    ],
    [
      'eleven-thirty',
      [this.createStudent('eleven-thirty-1', 'Eleven Thirty Student', false, 'RFID-11330', '11330', 75, 12, 9)],
    ],
  ]);

  getStudentsByGroupId(groupId: string | null): TenantAttendanceStudent[] {
    if (!groupId) {
      return [];
    }

    return (this.mockStudentsByGroupId.get(groupId) ?? []).map((student) => ({ ...student }));
  }

  loadStudentsByGroupId(groupId: string | null): Observable<TenantAttendanceStudent[]> {
    const selectedGroupId = groupId?.trim();
    if (!selectedGroupId) {
      return throwError(() => new Error('Group is required'));
    }

    return this.http.get<TenantGroupDetailsResponse>(this.groupsUrl + '/' + encodeURIComponent(selectedGroupId)).pipe(
      map((group) => (group.students ?? []).map((student) => this.toAttendanceStudent(student))),
      switchMap((students) => this.withStudentDetailBarcodes(students)),
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  scanBarcode(request: TenantBarcodeAttendanceScanRequest): Observable<TenantBarcodeAttendanceScanResponse> {
    return this.http.post<TenantBarcodeAttendanceScanResponse>(`${this.attendanceUrl}/barcode-scans`, request).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }


  saveManualAttendance(request: TenantManualAttendanceRequest): Observable<TenantManualAttendanceResponse> {
    return this.http.post<TenantManualAttendanceResponse>(`${this.attendanceUrl}/manual-checks`, request).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    );
  }

  async saveAttendance(groupId: string | null, students: TenantAttendanceStudent[]): Promise<void> {
    void groupId;
    void students;
    return Promise.resolve();
  }

  private toAttendanceStudent(student: TenantGroupStudentResponse): TenantAttendanceStudent {
    const attendanceState = student.attendanceState === 'Present' ? 'Present' : 'Absent';
    return this.createStudent(
      student.id,
      student.name,
      attendanceState === 'Present',
      null,
      this.extractBarcodeNumber(student),
      student.attendanceRate ?? 0,
      0,
      0,
      student.attendanceSource ?? (attendanceState === 'Present' ? 'Auto' : 'Manual'),
    );
  }

  private withStudentDetailBarcodes(students: TenantAttendanceStudent[]): Observable<TenantAttendanceStudent[]> {
    const missingBarcodeStudents = students.filter((student) => !student.barcode?.trim());
    if (missingBarcodeStudents.length === 0) {
      return of(students);
    }

    return forkJoin(
      missingBarcodeStudents.map((student) =>
        this.http.get<TenantStudentBackendRecord>(this.studentsUrl + '/' + encodeURIComponent(student.id)).pipe(
          map((record) => ({ studentId: student.id, barcode: this.extractBarcodeNumber(record) })),
          catchError(() => of({ studentId: student.id, barcode: null })),
        ),
      ),
    ).pipe(
      map((barcodeRows) => {
        const barcodesByStudentId = new Map(barcodeRows.map((row) => [row.studentId, row.barcode]));
        return students.map((student) => ({
          ...student,
          barcode: student.barcode?.trim() ? student.barcode : (barcodesByStudentId.get(student.id) ?? student.barcode),
        }));
      }),
    );
  }

  private extractBarcodeNumber(record: TenantGroupStudentResponse | TenantStudentBackendRecord): string | null {
    const barcode = record.barcodeNumber ?? record.barcode_number ?? null;
    return barcode?.trim() || null;
  }

  private createStudent(
    id: string,
    name: string,
    isPresent: boolean,
    rfid: string | null,
    barcode: string | null,
    attendanceRate: number,
    totalSessions: number,
    attendedSessions: number,
    manualStatus: 'Manual' | 'Auto' = 'Manual',
  ): TenantAttendanceStudent {
    return {
      id,
      name,
      rfid,
      barcode,
      isPresent,
      attendanceState: isPresent ? 'Present' : 'Absent',
      manualStatus,
      overrideChecks: 'Ready',
      attendanceRate,
      totalSessions,
      attendedSessions,
    };
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message = this.extractApiMessage(error.error) ?? 'Unable to load group attendance students';
    return throwError(() => new Error(message));
  }

  private extractApiMessage(error: unknown): string | null {
    if (typeof error === 'string' && error.trim()) {
      return error;
    }
    if (error && typeof error === 'object') {
      const candidate = error as { message?: unknown };
      if (typeof candidate.message === 'string' && candidate.message.trim()) {
        return candidate.message;
      }
    }
    return null;
  }
}
