import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { TenantGroupAttendanceDataService } from '../../data-access/tenant-group-attendance-data.service';
import { TenantScheduleDataService } from '../../data-access/tenant-schedule-data.service';
import {
  TenantAttendanceStudent,
  TenantBarcodeAttendancePaymentStatus,
  TenantBarcodeAttendanceScanResponse,
  TenantManualAttendanceResponse,
} from '../../models/tenant-group-attendance.models';
import { ScheduleSession } from '../../models/tenant-schedule.models';

interface AttendanceTimeSlot {
  time: string;
  hourSlot: string;
  groups: number;
  sortOrder: number;
  groupIds: Set<string>;
}

interface AttendanceGroupSummary {
  groupId: string;
  groupName: string;
  teacherName: string;
  roomName: string;
  startTime: string;
  locationTime: string;
  duration: number | null;
  days: string[];
  color: string;
  students: TenantAttendanceStudent[];
  studentCount: number;
  presentCount: number;
  attendancePercent: number;
}

interface AttendanceClockState {
  displayTime: string;
  hourSlot: string;
  timeZone: string;
  lastUpdatedAt: Date;
}

interface AttendancePaymentWarning {
  studentName: string;
  groupName: string;
  invoiceRef: string;
  amount: string;
  dueDate: string;
}

@Component({
  selector: 'app-tenant-attendance',
  imports: [RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-attendance.component.html',
  styleUrl: './tenant-attendance.component.css',
})
export class TenantAttendanceComponent implements OnInit, OnDestroy {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly scheduleDataService = inject(TenantScheduleDataService);
  private readonly groupAttendanceDataService = inject(TenantGroupAttendanceDataService);
  private readonly egyptTimeZone = 'Africa/Cairo';
  private clockTimer: ReturnType<typeof setInterval> | null = null;
  private scheduleLoadSubscription: Subscription | null = null;
  private autoSelectedTimeSlot: string | null = null;
  private readonly attendanceStudentsByGroupId = new Map<string, TenantAttendanceStudent[]>();
  private readonly attendanceStudentLoadSubscriptions = new Map<string, Subscription>();

  @ViewChild('barcodeInput') private barcodeInput?: ElementRef<HTMLInputElement>;

  nowFactory = (): Date => new Date();

  attendanceClock: AttendanceClockState = this.formatEgyptClock(this.nowFactory());

  scheduleSessions: ScheduleSession[] = [];
  scheduleLoading = false;
  scheduleLoadError: string | null = null;
  selectedTimeSlot: string | null = null;
  activeFilterApplied = false;
  activeFilterEmpty = false;
  barcodeInputValue = '';
  barcodeScanInProgress = false;
  barcodeScanNotification: { message: string; state: 'success' | 'error' | 'info' } | null = null;
  paymentWarningDialog: AttendancePaymentWarning | null = null;
  private pendingPaymentWarningScanResponse: TenantBarcodeAttendanceScanResponse | null = null;
  private pendingPaymentWarningManualResponse: TenantManualAttendanceResponse | null = null;

  get selectedStudents(): TenantAttendanceStudent[] {
    return this.selectedTimeSlotGroups.flatMap((group) => group.students);
  }

  get totalExpectedStudents(): number {
    return this.selectedStudents.length;
  }

  get presentCount(): number {
    return this.selectedStudents.filter((student) => student.isPresent).length;
  }

  get attendancePercent(): number {
    if (this.totalExpectedStudents === 0) {
      return 0;
    }

    return Math.round((this.presentCount / this.totalExpectedStudents) * 100);
  }

  get classAttendancePercent(): number {
    if (this.selectedStudents.length === 0) {
      return 0;
    }

    return Math.round((this.presentCount / this.selectedStudents.length) * 100);
  }

  get timeSlots(): AttendanceTimeSlot[] {
    const slotsByTime = new Map<string, AttendanceTimeSlot>();

    for (const session of this.scheduleSessions) {
      const normalizedSlot = this.normalizeTimeSlot(session.startTime);

      if (!normalizedSlot) {
        continue;
      }

      const groupKey = session.groupId || session.id;
      const currentSlot = slotsByTime.get(normalizedSlot.time);
      if (currentSlot) {
        currentSlot.groupIds.add(groupKey);
        currentSlot.groups = currentSlot.groupIds.size;
      } else {
        slotsByTime.set(normalizedSlot.time, { ...normalizedSlot, groups: 1, groupIds: new Set([groupKey]) });
      }
    }

    return Array.from(slotsByTime.values()).sort((first, second) => first.sortOrder - second.sortOrder);
  }

  get hasTimeSlots(): boolean {
    return this.timeSlots.length > 0;
  }

  get selectedTimeSlotLabel(): string {
    return this.selectedTimeSlot ?? 'No matching slot';
  }

  get selectedTimeSlotGroupCount(): number {
    return this.timeSlots.find((slot) => slot.time === this.selectedTimeSlot)?.groups ?? 0;
  }

  get selectedTimeSlotGroups(): AttendanceGroupSummary[] {
    if (!this.selectedTimeSlot) {
      return [];
    }

    const groupsById = new Map<string, AttendanceGroupSummary>();

    for (const session of this.scheduleSessions) {
      const normalizedSlot = this.normalizeTimeSlot(session.startTime);

      if (!normalizedSlot || normalizedSlot.time !== this.selectedTimeSlot) {
        continue;
      }

      const groupId = session.groupId || session.id;
      const existingGroup = groupsById.get(groupId);

      if (existingGroup) {
        if (!existingGroup.days.includes(session.day)) {
          existingGroup.days = [...existingGroup.days, session.day];
        }
        continue;
      }

      const students = this.getStudentsForGroup(groupId);
      const presentCount = this.getGroupPresentCount(students);
      const studentCount = students.length;

      groupsById.set(groupId, {
        groupId,
        groupName: session.groupName,
        teacherName: session.teacherName,
        roomName: session.roomName,
        startTime: normalizedSlot.time,
        locationTime: normalizedSlot.time,
        duration: session.duration,
        days: [session.day],
        color: session.color,
        students,
        studentCount,
        presentCount,
        attendancePercent: this.getGroupAttendancePercent(presentCount, studentCount),
      });
    }

    return Array.from(groupsById.values()).sort((first, second) => first.groupName.localeCompare(second.groupName));
  }

  get selectedTimeSlotGroupsLabel(): string {
    const count = this.selectedTimeSlotGroups.length;

    return `${count} ${count === 1 ? 'Group' : 'Groups'}`;
  }

  ngOnInit(): void {
    this.refreshAttendanceClock();
    this.loadScheduleSessions();
    this.clockTimer = setInterval(() => this.refreshAttendanceClock(), 60000);
  }

  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
    this.scheduleLoadSubscription?.unsubscribe();
    this.attendanceStudentLoadSubscriptions.forEach((subscription) => subscription.unsubscribe());
    this.attendanceStudentLoadSubscriptions.clear();
  }

  onBarcodeInput(value: string): void {
    this.barcodeInputValue = value;
  }

  submitBarcodeScan(): void {
    const barcodeNumber = this.barcodeInputValue.trim();
    if (!barcodeNumber) {
      this.barcodeScanNotification = { message: 'Barcode number is required', state: 'error' };
      this.focusBarcodeInput();
      this.changeDetectorRef.markForCheck();
      return;
    }

    this.barcodeScanInProgress = true;
    this.barcodeScanNotification = null;
    this.groupAttendanceDataService
      .scanBarcode({ barcodeNumber, selectedGroupId: this.selectedGroupHint() })
      .subscribe({
        next: (response) => this.handleBarcodeScanResponse(response),
        error: (error: Error) => {
          this.barcodeScanInProgress = false;
          this.barcodeScanNotification = {
            message: error.message || 'Unable to record barcode attendance',
            state: 'error',
          };
          this.focusBarcodeInput();
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  markStudentAttendance(groupId: string, studentId: string, isPresent: boolean): void {
    const attendanceState = isPresent ? 'Present' : 'Absent';
    this.groupAttendanceDataService.saveManualAttendance({ groupId, studentId, attendanceState }).subscribe({
      next: (response) => {
        if (isPresent && this.openManualPaymentWarningIfNeeded(response)) {
          this.pendingPaymentWarningManualResponse = response;
          this.barcodeScanNotification = { message: response.message, state: 'info' };
        } else {
          this.confirmSavedManualAttendance(response);
          this.barcodeScanNotification = { message: response.message, state: 'success' };
        }
        this.changeDetectorRef.markForCheck();
      },
      error: (error: Error) => {
        this.barcodeScanNotification = {
          message: error.message || 'Unable to save manual attendance',
          state: 'error',
        };
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  closePaymentWarningDialog(): void {
    this.paymentWarningDialog = null;
    this.pendingPaymentWarningScanResponse = null;
    this.pendingPaymentWarningManualResponse = null;
    this.focusBarcodeInput();
    this.changeDetectorRef.markForCheck();
  }

  continueAttendanceAfterPaymentWarning(): void {
    const pendingScanResponse = this.pendingPaymentWarningScanResponse;
    const pendingManualResponse = this.pendingPaymentWarningManualResponse;
    this.paymentWarningDialog = null;
    this.pendingPaymentWarningScanResponse = null;
    this.pendingPaymentWarningManualResponse = null;

    if (pendingScanResponse) {
      this.confirmSavedBarcodeAttendance(pendingScanResponse);
    } else if (pendingManualResponse) {
      this.confirmSavedManualAttendance(pendingManualResponse);
    }

    this.focusBarcodeInput();
    this.changeDetectorRef.markForCheck();
  }

  selectTimeSlot(time: string): void {
    this.selectedTimeSlot = time;
    this.autoSelectedTimeSlot = null;
    this.activeFilterApplied = false;
    this.activeFilterEmpty = false;
    this.changeDetectorRef.markForCheck();
  }

  filterGroupsByCurrentTime(): void {
    const currentMinute = this.getCurrentAttendanceMinute(this.nowFactory());
    const matchingSlot = this.findLatestActiveTimeSlot(currentMinute);

    this.activeFilterApplied = true;

    if (matchingSlot) {
      this.selectedTimeSlot = matchingSlot.time;
      this.autoSelectedTimeSlot = matchingSlot.time;
      this.activeFilterEmpty = false;
    } else {
      this.selectedTimeSlot = null;
      this.autoSelectedTimeSlot = null;
      this.activeFilterEmpty = true;
    }

    this.changeDetectorRef.markForCheck();
  }

  getGroupMark(groupName: string): string {
    const letters = groupName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');

    return letters || 'GR';
  }

  formatGroupDays(days: string[]): string {
    return days.join(', ');
  }

  formatGroupDuration(duration: number | null): string {
    return duration === null ? 'Duration not set' : `${duration} min`;
  }

  getStudentInitial(name: string): string {
    return name.trim()[0]?.toUpperCase() ?? 'S';
  }

  formatUnavailableValue(value: string | null): string {
    return value?.trim() || 'Unavailable';
  }

  private applyManualAttendanceResponse(groupId: string, studentId: string, attendanceState: 'Present' | 'Absent', attendanceTime: string): void {
    const isPresent = attendanceState === 'Present';
    const students = this.getStudentsForGroup(groupId);

    this.attendanceStudentsByGroupId.set(
      groupId,
      students.map((student) =>
        student.id === studentId
          ? {
              ...student,
              isPresent,
              attendanceState,
              attendanceTime,
              manualStatus: 'Manual',
              overrideChecks: 'Manual override saved',
            }
          : student,
      ),
    );
  }

  private selectedGroupHint(): string | null {
    const selectedGroups = this.selectedTimeSlotGroups;
    return selectedGroups.length === 1 ? selectedGroups[0].groupId : null;
  }

  private handleBarcodeScanResponse(response: TenantBarcodeAttendanceScanResponse): void {
    this.barcodeScanInProgress = false;
    this.barcodeScanNotification = {
      message: response.message,
      state: response.result === 'PRESENT_RECORDED' || response.result === 'ALREADY_PRESENT' ? 'success' : 'error',
    };

    if (this.isAcceptedBarcodeAttendance(response) && response.student && response.group && response.attendance) {
      if (this.openBarcodePaymentWarningIfNeeded(response)) {
        this.pendingPaymentWarningScanResponse = response;
        this.barcodeScanNotification = { message: response.message, state: 'info' };
      } else {
        this.confirmSavedBarcodeAttendance(response);
      }
      this.barcodeInputValue = '';
      if (this.barcodeInput?.nativeElement) {
        this.barcodeInput.nativeElement.value = '';
      }
    }

    this.focusBarcodeInput();
    this.changeDetectorRef.markForCheck();
  }

  private openBarcodePaymentWarningIfNeeded(response: TenantBarcodeAttendanceScanResponse): boolean {
    const groupId = response.group?.id;
    if (!groupId || !response.student || !response.group) {
      this.paymentWarningDialog = null;
      return false;
    }

    return this.openPaymentWarningIfNeeded(response.student.name, response.group.name, response.paymentStatus);
  }

  private openManualPaymentWarningIfNeeded(response: TenantManualAttendanceResponse): boolean {
    const group = this.selectedTimeSlotGroups.find((selectedGroup) => selectedGroup.groupId === response.groupId);
    const student = this.getStudentsForGroup(response.groupId).find((candidate) => candidate.id === response.studentId);

    if (!group || !student) {
      this.paymentWarningDialog = null;
      return false;
    }

    return this.openPaymentWarningIfNeeded(student.name, group.groupName, response.paymentStatus);
  }

  private openPaymentWarningIfNeeded(
    studentName: string,
    groupName: string,
    paymentStatus: TenantBarcodeAttendancePaymentStatus | null | undefined,
  ): boolean {
    if (!this.hasUnpaidInvoice(paymentStatus)) {
      this.paymentWarningDialog = null;
      return false;
    }

    this.paymentWarningDialog = {
      studentName,
      groupName,
      invoiceRef: paymentStatus.invoiceRef?.trim() || 'Unpaid invoice',
      amount: this.formatInvoiceAmount(paymentStatus.amount, paymentStatus.currency),
      dueDate: this.formatInvoiceDueDate(paymentStatus.dueDate),
    };
    return true;
  }

  private isAcceptedBarcodeAttendance(response: TenantBarcodeAttendanceScanResponse): boolean {
    return response.result === 'PRESENT_RECORDED' || response.result === 'ALREADY_PRESENT';
  }

  private confirmSavedBarcodeAttendance(response: TenantBarcodeAttendanceScanResponse): void {
    const updatedGroupId = this.applySavedBarcodeAttendance(response);
    this.reloadStudentsForGroup(updatedGroupId);
  }

  private confirmSavedManualAttendance(response: TenantManualAttendanceResponse): void {
    this.applyManualAttendanceResponse(response.groupId, response.studentId, response.attendanceState, response.scanTime);
    this.reloadStudentsForGroup(response.groupId);
  }

  private hasUnpaidInvoice(paymentStatus: TenantBarcodeAttendancePaymentStatus | null | undefined): paymentStatus is TenantBarcodeAttendancePaymentStatus {
    return paymentStatus?.hasUnpaidSubscriptionInvoice === true;
  }

  private formatInvoiceAmount(amount: number | string | null | undefined, currency: string | null | undefined): string {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) {
      return currency?.trim() || 'Amount not available';
    }

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency?.trim() || 'EGP',
        maximumFractionDigits: 2,
      }).format(numericAmount);
    } catch {
      return `${numericAmount.toFixed(2)} ${currency?.trim() || 'EGP'}`;
    }
  }

  private formatInvoiceDueDate(dueDate: string | null | undefined): string {
    const normalized = dueDate?.trim();
    if (!normalized) {
      return 'Due date not available';
    }

    const date = new Date(`${normalized}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return normalized;
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  private applySavedBarcodeAttendance(response: TenantBarcodeAttendanceScanResponse): string {
    if (!response.student || !response.group || !response.attendance) {
      return response.group?.id ?? '';
    }

    const groupId = this.resolveBarcodeAttendanceGroupId(response);
    const currentStudents = this.attendanceStudentsByGroupId.get(groupId) ?? this.groupAttendanceDataService.getStudentsByGroupId(groupId);
    const existingIndex = currentStudents.findIndex(
      (student) =>
        student.id === response.student?.id ||
        this.normalizeBarcodeValue(student.barcode) === this.normalizeBarcodeValue(response.student?.barcodeNumber),
    );
    const scannedStudent: TenantAttendanceStudent = {
      id: response.student.id,
      name: response.student.name,
      rfid: null,
      barcode: response.student.barcodeNumber,
      isPresent: true,
      attendanceState: 'Present',
      attendanceTime: response.attendance.scanTime,
      manualStatus: response.attendance.source,
      overrideChecks: 'Auto barcode scan saved',
      attendanceRate: 0,
      totalSessions: 0,
      attendedSessions: 0,
    };

    const updatedStudents = currentStudents.map((student, index) =>
      index === existingIndex
        ? {
            ...student,
            name: response.student?.name ?? student.name,
            barcode: response.student?.barcodeNumber ?? student.barcode,
            isPresent: true,
            attendanceState: 'Present' as const,
            attendanceTime: response.attendance?.scanTime ?? student.attendanceTime,
            manualStatus: 'Auto' as const,
            overrideChecks: 'Auto barcode scan saved',
          }
        : student,
    );

    if (existingIndex === -1) {
      updatedStudents.push(scannedStudent);
    }

    this.attendanceStudentsByGroupId.set(groupId, updatedStudents);
    return groupId;
  }

  private resolveBarcodeAttendanceGroupId(response: TenantBarcodeAttendanceScanResponse): string {
    const responseGroupId = response.group?.id;
    if (!responseGroupId) {
      return '';
    }

    if (this.attendanceStudentsByGroupId.has(responseGroupId)) {
      return responseGroupId;
    }

    const selectedGroups = this.selectedTimeSlotGroups;
    const sameIdGroup = selectedGroups.find((group) => group.groupId === responseGroupId);
    if (sameIdGroup) {
      return sameIdGroup.groupId;
    }

    const sameGroupDetails = selectedGroups.find(
      (group) =>
        group.groupName === response.group?.name &&
        this.normalizeTimeSlot(group.startTime)?.time === this.normalizeTimeSlot(response.group?.startTime ?? '')?.time,
    );
    if (sameGroupDetails) {
      return sameGroupDetails.groupId;
    }

    const studentBarcode = this.normalizeBarcodeValue(response.student?.barcodeNumber);
    const groupWithStudent = selectedGroups.find((group) =>
      group.students.some(
        (student) => student.id === response.student?.id || this.normalizeBarcodeValue(student.barcode) === studentBarcode,
      ),
    );
    if (groupWithStudent) {
      return groupWithStudent.groupId;
    }

    return responseGroupId;
  }

  private focusBarcodeInput(): void {
    setTimeout(() => this.barcodeInput?.nativeElement.focus(), 0);
  }

  private getGroupPresentCount(students: TenantAttendanceStudent[]): number {
    return students.filter((student) => student.isPresent).length;
  }

  private getGroupAttendancePercent(presentCount: number, studentCount: number): number {
    if (studentCount === 0) {
      return 0;
    }

    return Math.round((presentCount / studentCount) * 100);
  }

  formatAttendanceTime(value: string | null | undefined): string {
    const normalized = value?.trim();
    if (!normalized) {
      return 'Not recorded';
    }

    const date = new Date(normalized);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: this.egyptTimeZone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    }

    const timeMatch = normalized.match(/(\d{1,2}:\d{2})(?::\d{2})?(?:\s*(AM|PM))?/i);
    if (timeMatch) {
      return `${timeMatch[1]}${timeMatch[2] ? ` ${timeMatch[2].toUpperCase()}` : ''}`;
    }

    return normalized;
  }

  refreshAttendanceClock(): void {
    this.attendanceClock = this.formatEgyptClock(this.nowFactory());
    this.changeDetectorRef.markForCheck();
  }

  private findLatestActiveTimeSlot(currentMinute: number): Pick<AttendanceTimeSlot, 'time' | 'sortOrder'> | null {
    let latestActiveSlot: Pick<AttendanceTimeSlot, 'time' | 'sortOrder'> | null = null;

    for (const session of this.scheduleSessions) {
      const normalizedSlot = this.normalizeTimeSlot(session.startTime);
      const duration = session.duration;

      if (!normalizedSlot || !this.isValidActiveFilterDuration(duration)) {
        continue;
      }

      const startMinute = normalizedSlot.sortOrder;
      const endMinute = startMinute + duration;
      const active = startMinute <= currentMinute && currentMinute < endMinute;

      if (!active) {
        continue;
      }

      if (!latestActiveSlot || startMinute > latestActiveSlot.sortOrder) {
        latestActiveSlot = { time: normalizedSlot.time, sortOrder: startMinute };
      }
    }

    return latestActiveSlot;
  }

  private getCurrentAttendanceMinute(date: Date): number {
    return this.normalizeTimeSlot(this.formatEgyptClock(date).displayTime)?.sortOrder ?? -1;
  }

  private isValidActiveFilterDuration(duration: number | null): duration is number {
    return typeof duration === 'number' && Number.isFinite(duration) && duration > 0;
  }

  private loadScheduleSessions(): void {
    this.scheduleLoading = true;
    this.scheduleLoadError = null;
    this.scheduleLoadSubscription?.unsubscribe();
    this.scheduleLoadSubscription = this.scheduleDataService.loadSessions(this.currentEgyptDate()).subscribe({
      next: (sessions) => {
        this.scheduleSessions = sessions;
        this.scheduleLoading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: (error: Error) => {
        this.scheduleSessions = [];
        this.scheduleLoading = false;
        this.scheduleLoadError = error.message || 'Unable to load schedule';
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  private formatEgyptClock(date: Date): AttendanceClockState {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: this.egyptTimeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(date);

    const hour = this.getDatePart(parts, 'hour');
    const minute = this.getDatePart(parts, 'minute');
    const dayPeriod = this.getDatePart(parts, 'dayPeriod');

    return {
      displayTime: `${hour}:${minute} ${dayPeriod}`,
      hourSlot: `${hour}:00 ${dayPeriod}`,
      timeZone: this.egyptTimeZone,
      lastUpdatedAt: date,
    };
  }

  private currentEgyptDate(): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.egyptTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(this.nowFactory());
    const year = this.getDatePart(parts, 'year');
    const month = this.getDatePart(parts, 'month');
    const day = this.getDatePart(parts, 'day');
    return `${year}-${month}-${day}`;
  }

  private normalizeTimeSlot(time: string): Pick<AttendanceTimeSlot, 'time' | 'hourSlot' | 'sortOrder'> | null {
    const trimmedTime = time.trim();
    const periodMatch = trimmedTime.match(/^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(AM|PM)$/i);

    if (periodMatch) {
      const hour = Number(periodMatch[1]);
      const minute = periodMatch[2] ? Number(periodMatch[2]) : 0;
      const second = periodMatch[3] ? Number(periodMatch[3]) : 0;
      const dayPeriod = periodMatch[4].toUpperCase();

      if (hour < 1 || hour > 12 || minute < 0 || minute > 59 || second < 0 || second > 59) {
        return null;
      }

      const hourInDay = dayPeriod === 'AM' ? hour % 12 : (hour % 12) + 12;
      const displayHour = hour.toString();
      const displayMinute = String(minute).padStart(2, '0');

      return {
        time: `${displayHour}:${displayMinute} ${dayPeriod}`,
        hourSlot: `${displayHour}:00 ${dayPeriod}`,
        sortOrder: hourInDay * 60 + minute,
      };
    }

    const twentyFourHourMatch = trimmedTime.match(/^(\d{1,2})(?::(\d{2}))(?::(\d{2}))?$/);

    if (!twentyFourHourMatch) {
      return null;
    }

    const hour = Number(twentyFourHourMatch[1]);
    const minute = Number(twentyFourHourMatch[2]);
    const second = twentyFourHourMatch[3] ? Number(twentyFourHourMatch[3]) : 0;

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
      return null;
    }

    const dayPeriod = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const displayMinute = String(minute).padStart(2, '0');

    return {
      time: `${displayHour}:${displayMinute} ${dayPeriod}`,
      hourSlot: `${displayHour}:00 ${dayPeriod}`,
      sortOrder: hour * 60 + minute,
    };
  }

  private getDatePart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
    return parts.find((part) => part.type === type)?.value ?? '';
  }

  private getStudentsForGroup(groupId: string): TenantAttendanceStudent[] {
    const existingStudents = this.attendanceStudentsByGroupId.get(groupId);

    if (existingStudents) {
      return existingStudents;
    }

    const students = this.groupAttendanceDataService.getStudentsByGroupId(groupId);
    this.attendanceStudentsByGroupId.set(groupId, students);
    if (students.length === 0) {
      this.loadStudentsForGroup(groupId);
    }

    return students;
  }

  private reloadStudentsForGroup(groupId: string): void {
    if (!groupId) {
      return;
    }

    this.attendanceStudentLoadSubscriptions.get(groupId)?.unsubscribe();
    this.attendanceStudentLoadSubscriptions.delete(groupId);
    this.loadStudentsForGroup(groupId, true);
  }

  private loadStudentsForGroup(groupId: string, forceReload = false): void {
    if (!forceReload && this.attendanceStudentLoadSubscriptions.has(groupId)) {
      return;
    }

    const subscription = this.groupAttendanceDataService.loadStudentsByGroupId(groupId).subscribe({
      next: (students) => {
        this.attendanceStudentsByGroupId.set(groupId, this.mergeConfirmedPresentStudents(groupId, students));
        this.attendanceStudentLoadSubscriptions.delete(groupId);
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.attendanceStudentLoadSubscriptions.delete(groupId);
        this.changeDetectorRef.markForCheck();
      },
    });

    this.attendanceStudentLoadSubscriptions.set(groupId, subscription);
  }

  private mergeConfirmedPresentStudents(groupId: string, students: TenantAttendanceStudent[]): TenantAttendanceStudent[] {
    const currentStudents = this.attendanceStudentsByGroupId.get(groupId) ?? [];
    const confirmedPresentStudents = currentStudents.filter((student) => student.isPresent);

    if (confirmedPresentStudents.length === 0) {
      return students;
    }

    return students.map((student) => {
      const matchingConfirmedStudent = confirmedPresentStudents.find(
        (confirmedStudent) =>
          confirmedStudent.id === student.id ||
          this.normalizeBarcodeValue(confirmedStudent.barcode) === this.normalizeBarcodeValue(student.barcode),
      );

      if (!matchingConfirmedStudent || student.isPresent) {
        return student;
      }

      return {
        ...student,
        isPresent: true,
        attendanceState: 'Present',
        attendanceTime: matchingConfirmedStudent.attendanceTime,
        manualStatus: matchingConfirmedStudent.manualStatus,
        overrideChecks: matchingConfirmedStudent.overrideChecks,
      };
    });
  }

  private normalizeBarcodeValue(value: string | null | undefined): string {
    return value?.trim() ?? '';
  }
}
