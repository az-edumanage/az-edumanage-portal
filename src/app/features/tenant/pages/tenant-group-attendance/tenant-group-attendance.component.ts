import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TenantGroupAttendanceFacade } from '../../state/tenant-group-attendance.facade';
import { TenantAttendanceStudent } from '../../models/tenant-group-attendance.models';

type AttendanceStudentFilter = 'all' | 'present' | 'absent';

@Component({
  selector: 'app-tenant-group-attendance',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './tenant-group-attendance.component.html'})
export class TenantGroupAttendanceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantGroupAttendanceFacade);

  readonly groupId = this.facade.groupId;
  readonly groupName = this.facade.groupName;
  readonly today = this.facade.today;
  readonly students = this.facade.students;
  readonly isLoading = this.facade.isLoading;
  readonly error = this.facade.error;
  readonly attendanceAvailable = this.facade.attendanceAvailable;
  readonly attendanceBlockedMessage = this.facade.attendanceBlockedMessage;
  readonly presentCount = this.facade.presentCount;
  readonly absentCount = this.facade.absentCount;
  readonly attendanceRate = this.facade.attendanceRate;
  readonly studentSearchTerm = signal('');
  readonly studentFilter = signal<AttendanceStudentFilter>('all');
  readonly studentPageIndex = signal(0);
  readonly studentPageSize = signal(5);
  readonly barcodeInput = signal('');
  readonly barcodeMessage = signal<string | null>(null);
  readonly barcodeMessageState = signal<'success' | 'error' | null>(null);
  readonly filteredStudents = computed(() => {
    const query = this.studentSearchTerm().trim().toLowerCase();
    const filter = this.studentFilter();
    return this.students().filter((student) => {
      const matchesFilter = filter === 'all' || (filter === 'present' ? student.isPresent : !student.isPresent);
      const matchesSearch =
        !query ||
        [
          student.name,
          student.id,
          student.barcode ?? '',
          student.rfid ?? '',
          student.attendanceState,
          student.manualStatus,
        ].some((value) => value.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  });
  readonly studentTotalPages = computed(() => Math.max(1, Math.ceil(this.filteredStudents().length / this.studentPageSize())));
  readonly pagedStudents = computed(() => {
    const pageIndex = this.studentVisiblePageIndex();
    const start = pageIndex * this.studentPageSize();
    return this.filteredStudents().slice(start, start + this.studentPageSize());
  });

  ngOnInit() {
    void this.facade.loadGroup(this.route.snapshot.paramMap.get('id'));
  }

  toggleAttendance(id: string, isPresent: boolean) {
    if (!this.attendanceAvailable()) {
      return;
    }
    this.facade.toggleAttendance(id, isPresent);
  }

  setStudentSearchTerm(value: string): void {
    this.studentSearchTerm.set(value);
    this.studentPageIndex.set(0);
  }

  setStudentFilter(value: string): void {
    this.studentFilter.set(this.isStudentFilter(value) ? value : 'all');
    this.studentPageIndex.set(0);
  }

  setStudentPageSize(value: string): void {
    this.studentPageSize.set(Number(value));
    this.studentPageIndex.set(0);
  }

  previousStudentPage(): void {
    this.studentPageIndex.update((page) => Math.max(0, page - 1));
  }

  nextStudentPage(): void {
    this.studentPageIndex.update((page) => Math.min(this.studentTotalPages() - 1, page + 1));
  }

  studentVisiblePageIndex(): number {
    return Math.min(this.studentPageIndex(), this.studentTotalPages() - 1);
  }

  studentPageStart(): number {
    const total = this.filteredStudents().length;
    return total === 0 ? 0 : this.studentVisiblePageIndex() * this.studentPageSize() + 1;
  }

  studentPageEnd(): number {
    return Math.min(this.filteredStudents().length, this.studentPageStart() + this.pagedStudents().length - 1);
  }

  setBarcodeInput(value: string): void {
    this.barcodeInput.set(value);
    this.barcodeMessage.set(null);
    this.barcodeMessageState.set(null);
  }

  markBarcodePresent(): void {
    if (!this.attendanceAvailable()) {
      this.barcodeMessage.set(this.attendanceBlockedMessage());
      this.barcodeMessageState.set('error');
      return;
    }

    const barcode = this.normalizeBarcode(this.barcodeInput());
    if (!barcode) {
      this.barcodeMessage.set('Enter a student barcode.');
      this.barcodeMessageState.set('error');
      return;
    }

    const student = this.students().find((row) =>
      this.normalizeBarcode(row.barcode) === barcode || this.normalizeBarcode(row.rfid) === barcode,
    );
    if (!student) {
      this.barcodeMessage.set('No enrolled student matches this barcode.');
      this.barcodeMessageState.set('error');
      return;
    }

    this.facade.toggleAttendance(student.id, true);
    this.barcodeInput.set('');
    this.barcodeMessage.set(`${student.name} marked present.`);
    this.barcodeMessageState.set('success');
  }

  statusLabel(student: TenantAttendanceStudent): string {
    return student.isPresent ? 'Present' : 'Absent';
  }

  markAll(isPresent: boolean) {
    if (!this.attendanceAvailable()) {
      return;
    }
    this.facade.markAll(isPresent);
  }

  async saveAttendance() {
    if (!this.attendanceAvailable()) {
      return;
    }
    await this.facade.saveAttendance();
    alert('Attendance saved successfully!');
  }

  private isStudentFilter(value: string): value is AttendanceStudentFilter {
    return value === 'all' || value === 'present' || value === 'absent';
  }

  private normalizeBarcode(value: string | null | undefined): string {
    return value?.trim().toLowerCase() ?? '';
  }
}
