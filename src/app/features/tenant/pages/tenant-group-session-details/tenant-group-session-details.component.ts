import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, firstValueFrom } from 'rxjs';
import { jsPDF } from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { TenantGroupAttendanceDataService } from '../../data-access/tenant-group-attendance-data.service';
import {
  GroupDetails,
  GroupExamRow,
  GroupLesson,
  GroupLessonContent,
  GroupSessionLibraryContent,
  GroupSessionPostponeAvailability,
  GroupSessionPostponeResult,
  GroupSessionTeacherAbsence,
  GroupSessionTeacherOption,
  GroupSessionPublication,
  GroupStudent,
} from '../../models/tenant-group-details.models';
import { TenantBarcodeAttendanceScanResponse } from '../../models/tenant-group-attendance.models';
import { TenantGroupDetailsDataService } from '../../data-access/tenant-group-details-data.service';
import { TenantGroupDetailsScope } from '../../state/tenant-group-details.store';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import {
  TenantCurriculumMaterialFile,
  TenantCurriculumMaterialFolder,
  TenantCurriculumMaterialLink,
  TenantCurriculumMaterialNote,
  TenantSubjectCurriculumNode,
} from '../../models/tenant-subjects.models';

interface SessionDetailsRow {
  id: string;
  day: string;
  date: string;
  startTime: string;
  endTime: string;
  timeRange: string;
  room: string;
  kind: 'dated' | 'recurring';
}

interface LessonNoteBlock {
  data?: {
    text?: string;
    caption?: string;
    items?: string[];
  };
}

interface LessonNoteContent {
  blocks?: LessonNoteBlock[];
}

interface LessonMaterialSource {
  nodeId: string;
  nodeLabel: string;
  folder: TenantCurriculumMaterialFolder;
}

interface LessonMaterialOption {
  id: string;
  type: GroupLessonContent['contentType'];
  title: string;
  url?: string | null;
  fileContentType?: string | null;
  sizeBytes?: number | null;
  source: LessonMaterialSource;
}

interface CurriculumLessonOption {
  id: string;
  title: string;
  path: string;
  description: string | null;
}

type SessionStatusTone = 'info' | 'success' | 'muted';
type StudentStatusFilter = 'all' | 'present' | 'absent';
type LessonPickerStatusFilter = 'all' | 'available' | 'inserted';
type SessionLiveStatus = 'coming' | 'running' | 'ended';
type PreviewableLessonContent = GroupLessonContent | GroupSessionLibraryContent;
type SessionContentTab = 'students' | 'lessons' | 'exams';
type PendingDeleteSessionLesson =
  | { kind: 'lesson'; item: GroupLesson }
  | { kind: 'library'; item: GroupSessionLibraryContent };
type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY?: number };
};
type PendingSessionHomeWorkRow = GroupExamRow;

@Component({
  selector: 'app-tenant-group-session-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-group-session-details.component.html',
  styleUrl: './tenant-group-session-details.component.css',
})
export class TenantGroupSessionDetailsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(TenantGroupDetailsDataService);
  private readonly attendanceData = inject(TenantGroupAttendanceDataService);
  private readonly subjectsData = inject(TenantSubjectsDataService);
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);

  @ViewChild('sessionBarcodeInput') private sessionBarcodeInput?: ElementRef<HTMLInputElement>;

  groupId = this.route.snapshot.paramMap.get('id');
  sessionId = this.route.snapshot.paramMap.get('sessionId');
  readonly detailScope: TenantGroupDetailsScope = this.route.snapshot.data['scope'] === 'teacher' ? 'teacher' : 'tenant';
  readonly isTeacherGroupView = this.detailScope === 'teacher';
  readonly groupListRoute = this.isTeacherGroupView ? '/teacher/groups' : '/tenant/groups';
  readonly group = signal<GroupDetails | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly lessons = signal<GroupLesson[]>([]);
  readonly lessonsLoading = signal(false);
  readonly lessonsError = signal<string | null>(null);
  readonly sessionExams = signal<GroupExamRow[]>([]);
  readonly sessionExamsLoading = signal(false);
  readonly sessionExamsError = signal<string | null>(null);
  readonly pendingDeleteSessionExam = signal<GroupExamRow | null>(null);
  readonly deletingSessionExamId = signal<string | null>(null);
  readonly sessionExamActionError = signal<string | null>(null);
  readonly pendingDeleteSessionLesson = signal<PendingDeleteSessionLesson | null>(null);
  readonly sessionLessonActionError = signal<string | null>(null);
  readonly activeContentTab = signal<SessionContentTab>('students');
  readonly studentSearch = signal('');
  readonly studentStatusFilter = signal<StudentStatusFilter>('all');
  readonly studentPageIndex = signal(0);
  readonly studentPageSize = signal(5);
  readonly lessonPageIndex = signal(0);
  readonly lessonPageSize = signal(5);
  readonly examPageIndex = signal(0);
  readonly examPageSize = signal(5);
  readonly expandedLessonIds = signal<ReadonlySet<string>>(new Set());
  readonly lessonContentByLessonId = signal<ReadonlyMap<string, GroupLessonContent[]>>(new Map());
  readonly lessonContentLoadingIds = signal<ReadonlySet<string>>(new Set());
  readonly lessonContentErrors = signal<ReadonlyMap<string, string>>(new Map());
  readonly selectedLessonContentByLessonId = signal<ReadonlyMap<string, GroupLessonContent>>(new Map());
  readonly lessonPickerOpen = signal(false);
  readonly lessonPickerLoading = signal(false);
  readonly lessonPickerError = signal<string | null>(null);
  readonly lessonCurriculumRoot = signal<TenantSubjectCurriculumNode | null>(null);
  readonly lessonPickerSearch = signal('');
  readonly lessonPickerStatusFilter = signal<LessonPickerStatusFilter>('all');
  readonly libraryPickerOpen = signal(false);
  readonly libraryPickerLoading = signal(false);
  readonly libraryPickerError = signal<string | null>(null);
  readonly libraryFolders = signal<TenantCurriculumMaterialFolder[]>([]);
  readonly selectedLibraryFolder = signal<TenantCurriculumMaterialFolder | null>(null);
  readonly expandedLibraryFolderIds = signal<ReadonlySet<string>>(new Set());
  readonly libraryFilesByFolderId = signal<ReadonlyMap<string, TenantCurriculumMaterialFile[]>>(new Map());
  readonly libraryNotesByFolderId = signal<ReadonlyMap<string, TenantCurriculumMaterialNote[]>>(new Map());
  readonly libraryFileLoadingIds = signal<ReadonlySet<string>>(new Set());
  readonly libraryFileErrors = signal<ReadonlyMap<string, string>>(new Map());
  readonly selectedLibraryFileIds = signal<ReadonlySet<string>>(new Set());
  readonly selectedLibraryNoteIds = signal<ReadonlySet<string>>(new Set());
  readonly sessionLibraryContent = signal<GroupSessionLibraryContent[]>([]);
  readonly sessionPublication = signal<GroupSessionPublication | null>(null);
  readonly publishingSession = signal(false);
  readonly publishSessionMessage = signal<string | null>(null);
  readonly publishSessionError = signal<string | null>(null);
  readonly generatingReport = signal(false);
  readonly reportError = signal<string | null>(null);
  readonly reportPreviewOpen = signal(false);
  readonly reportPreviewObjectUrl = signal<string | null>(null);
  readonly reportPreviewSafeObjectUrl = signal<SafeResourceUrl | null>(null);
  readonly reportPreviewFileName = signal('session-report.pdf');
  readonly postponeChoiceOpen = signal(false);
  readonly postponeAppointmentOpen = signal(false);
  readonly postponeReplaceOpen = signal(false);
  readonly postponeAvailability = signal<GroupSessionPostponeAvailability | null>(null);
  readonly postponeLoadingAvailability = signal(false);
  readonly postponeSubmitting = signal(false);
  readonly postponeError = signal<string | null>(null);
  readonly postponeSuccess = signal<GroupSessionPostponeResult | null>(null);
  readonly postponeAppointmentDate = signal('');
  readonly postponeAppointmentTime = signal('');
  readonly postponeAppointmentRoomId = signal('');
  readonly postponeReason = signal('');
  readonly teacherAbsenceOpen = signal(false);
  readonly teacherAbsenceOptionsOpen = signal(false);
  readonly teacherReplacementOpen = signal(false);
  readonly teacherAbsence = signal<GroupSessionTeacherAbsence | null>(null);
  readonly teacherAbsenceReason = signal('');
  readonly teacherAbsenceSaving = signal(false);
  readonly teacherAbsenceError = signal<string | null>(null);
  readonly teacherAbsenceSuccess = signal<string | null>(null);
  readonly replacementTeachers = signal<GroupSessionTeacherOption[]>([]);
  readonly replacementTeachersLoading = signal(false);
  readonly replacementTeacherSaving = signal(false);
  readonly selectedReplacementTeacherId = signal('');
  readonly savingLessonNodeId = signal<string | null>(null);
  readonly removingLessonId = signal<string | null>(null);
  readonly updatingLessonCompletionId = signal<string | null>(null);
  readonly previewContent = signal<PreviewableLessonContent | null>(null);
  readonly previewNote = signal<TenantCurriculumMaterialNote | null>(null);
  readonly previewLoading = signal(false);
  readonly previewError = signal<string | null>(null);
  readonly previewObjectUrl = signal<string | null>(null);
  readonly previewSafeObjectUrl = signal<SafeResourceUrl | null>(null);
  readonly barcodeInputValue = signal('');
  readonly barcodeScanInProgress = signal(false);
  readonly barcodeScanNotification = signal<{ message: string; state: 'success' | 'error' } | null>(null);
  readonly updatingStudentAttendanceId = signal<string | null>(null);
  readonly currentTime = signal(new Date());
  readonly session = computed(() => this.sessionRows().find((row) => row.id === this.sessionId) ?? null);
  readonly sessionRows = computed<SessionDetailsRow[]>(() => this.buildSessionRows(this.group()));
  readonly sessionStudents = computed<GroupStudent[]>(() => this.group()?.students ?? []);
  readonly presentStudentCount = computed(() => this.sessionStudents().filter((student) => this.studentStatusLabel(student) === 'Present').length);
  readonly absentStudentCount = computed(() => Math.max(0, this.sessionStudents().length - this.presentStudentCount()));
  readonly filteredSessionStudents = computed(() => this.filterSessionStudents(this.sessionStudents()));
  readonly studentTotalPages = computed(() => Math.max(1, Math.ceil(this.filteredSessionStudents().length / this.studentPageSize())));
  readonly visibleSessionStudents = computed(() => {
    const pageIndex = Math.min(this.studentPageIndex(), this.studentTotalPages() - 1);
    const pageSize = this.studentPageSize();
    return this.filteredSessionStudents().slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);
  });
  readonly lessonTotalPages = computed(() => Math.max(1, Math.ceil(this.lessons().length / this.lessonPageSize())));
  readonly visibleSessionLessons = computed(() => {
    const pageIndex = Math.min(this.lessonPageIndex(), this.lessonTotalPages() - 1);
    const pageSize = this.lessonPageSize();
    return this.lessons().slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);
  });
  readonly assignedSessionExams = computed(() =>
    this.withPendingSessionHomeWork(this.sessionExams())
      .filter((exam) => this.isExamAssignedToSession(exam, this.session())),
  );
  readonly examTotalPages = computed(() => Math.max(1, Math.ceil(this.assignedSessionExams().length / this.examPageSize())));
  readonly visibleSessionExams = computed(() => {
    const pageIndex = Math.min(this.examPageIndex(), this.examTotalPages() - 1);
    const pageSize = this.examPageSize();
    return this.assignedSessionExams().slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);
  });
  readonly curriculumLessonOptions = computed<CurriculumLessonOption[]>(() => {
    const root = this.lessonCurriculumRoot();
    return root ? this.flattenCurriculumLessons(root) : [];
  });
  readonly filteredCurriculumLessonOptions = computed<CurriculumLessonOption[]>(() =>
    this.filterCurriculumLessonOptions(this.curriculumLessonOptions()),
  );
  readonly selectedLibraryItemCount = computed(() => this.selectedLibraryFileIds().size + this.selectedLibraryNoteIds().size);
  readonly availablePostponeRooms = computed(() => this.postponeAvailability()?.rooms.filter((room) => room.available) ?? []);
  readonly sessionTeacherName = computed(() => {
    const absence = this.teacherAbsence();
    return absence?.replacementTeacherName || this.group()?.teacher || 'Not assigned';
  });
  readonly originalSessionTeacherName = computed(() =>
    this.teacherAbsence()?.originalTeacherName || this.group()?.teacher || 'Not assigned',
  );
  readonly canConfirmPostponeAppointment = computed(() =>
    Boolean(
      this.postponeAppointmentDate().trim()
      && this.postponeAppointmentTime().trim()
      && this.postponeAppointmentRoomId().trim()
      && this.postponeAvailability()?.teacherAvailable
      && this.availablePostponeRooms().some((room) => room.id === this.postponeAppointmentRoomId()),
    ),
  );
  private readonly groupRefreshIntervalMs = 5000;
  private clockIntervalId: ReturnType<typeof setInterval> | null = null;
  private groupRefreshIntervalId: ReturnType<typeof setInterval> | null = null;
  private routeParamSubscription: Subscription | null = null;
  private routeQuerySubscription: Subscription | null = null;
  private refreshingGroup = false;

  ngOnInit(): void {
    this.clockIntervalId = setInterval(() => this.currentTime.set(new Date()), 1000);
    this.groupRefreshIntervalId = setInterval(() => void this.refreshGroup(), this.groupRefreshIntervalMs);
    this.routeParamSubscription = this.route.paramMap.subscribe((params) => {
      const nextGroupId = params.get('id');
      const nextSessionId = params.get('sessionId');
      if (nextGroupId === this.groupId && nextSessionId === this.sessionId && this.group()) {
        return;
      }
      this.groupId = nextGroupId;
      this.sessionId = nextSessionId;
      this.resetSessionScopedState();
      void this.loadSessionData();
    });
    this.routeQuerySubscription = this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab');
      if (tab === 'students' || tab === 'lessons' || tab === 'exams') {
        this.activeContentTab.set(tab);
      } else if (tab === 'homeWork') {
        this.activeContentTab.set('exams');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.clockIntervalId) {
      clearInterval(this.clockIntervalId);
    }
    if (this.groupRefreshIntervalId) {
      clearInterval(this.groupRefreshIntervalId);
    }
    this.routeParamSubscription?.unsubscribe();
    this.routeQuerySubscription?.unsubscribe();
    this.clearPreviewObjectUrl();
    this.clearReportPreviewObjectUrl();
  }

  sessionIndex(session: SessionDetailsRow): number {
    const index = this.sessionRows().findIndex((row) => row.id === session.id);
    return index >= 0 ? index + 1 : 1;
  }

  sessionKindLabel(session: SessionDetailsRow): string {
    return session.kind === 'dated' ? 'Dated session' : 'Recurring session';
  }

  sessionDateLabel(session: SessionDetailsRow): string {
    if (session.kind !== 'dated') {
      return 'Recurring schedule';
    }

    const date = this.sessionDate(session);
    if (!date) {
      return session.date || 'Scheduled';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  sessionStatusLabel(session: SessionDetailsRow): string {
    if (session.kind !== 'dated') {
      return 'Recurring';
    }

    const now = new Date();
    const start = this.sessionDateTime(session, session.startTime);
    const end = this.sessionDateTime(session, session.endTime);

    if (start && end && now >= start && now < end) {
      return 'Running now';
    }

    if (start && now < start) {
      return 'Upcoming';
    }

    if (end && now >= end) {
      return 'Completed';
    }

    return 'Scheduled';
  }

  sessionStatusTone(session: SessionDetailsRow): SessionStatusTone {
    const status = this.sessionStatusLabel(session);
    if (status === 'Running now') {
      return 'success';
    }
    if (status === 'Completed' || status === 'Recurring') {
      return 'muted';
    }
    return 'info';
  }

  sessionDurationLabel(session: SessionDetailsRow): string {
    const start = this.minutesFromTime(session.startTime);
    const end = this.minutesFromTime(session.endTime);
    if (start === null || end === null) {
      return 'Duration not set';
    }

    const duration = end >= start ? end - start : end + 24 * 60 - start;
    if (duration <= 0) {
      return 'Duration not set';
    }

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (hours && minutes) {
      return `${hours}h ${minutes}m`;
    }
    if (hours) {
      return `${hours}h`;
    }
    return `${minutes}m`;
  }

  currentTimeLabel(): string {
    return this.currentTime().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }

  sessionTimeWindowLabel(session: SessionDetailsRow): string {
    const start = this.displayMeridiemTime(session.startTime);
    const end = this.displayMeridiemTime(session.endTime);
    if (start && end) {
      return `${start} to ${end}`;
    }
    return start || end || 'Time not set';
  }

  sessionLiveStatusLabel(session: SessionDetailsRow): string {
    const status = this.sessionLiveStatus(session);
    if (status === 'running') {
      return 'Running';
    }
    if (status === 'ended') {
      return 'Ended';
    }
    return 'Coming';
  }

  sessionLiveStatusClass(session: SessionDetailsRow): string {
    return `tenant-group-session-stat-status tenant-group-session-stat-status--${this.sessionLiveStatus(session)}`;
  }

  sessionStopwatchLabel(session: SessionDetailsRow): string {
    const window = this.sessionWindow(session);
    if (!window) {
      return '00:00:00';
    }

    const now = this.currentTime().getTime();
    const start = window.start.getTime();
    const end = window.end.getTime();
    const remaining = now < start ? start - now : Math.max(0, end - now);
    return this.durationClockLabel(remaining);
  }

  sessionCapacityLabel(group: GroupDetails | null): string {
    if (!group) {
      return '0 / 0';
    }
    return `${group.enrolled} / ${group.capacity}`;
  }
  studentStatusLabel(student: GroupStudent): string {
    const selectedSession = this.session();
    if (selectedSession && this.sessionLiveStatus(selectedSession) === 'coming') {
      return 'Absent';
    }
    if (selectedSession && student.attendanceState === 'Present' && !this.studentAttendanceInSessionWindow(student, selectedSession)) {
      return 'Absent';
    }
    return student.attendanceState === 'Present' ? 'Present' : 'Absent';
  }

  studentStatusClass(student: GroupStudent): string {
    const status = this.studentStatusLabel(student);
    if (status === 'Present') {
      return 'tenant-group-session-table-status tenant-group-session-table-status--present';
    }
    if (status === 'Absent') {
      return 'tenant-group-session-table-status tenant-group-session-table-status--absent';
    }
    return 'tenant-group-session-table-status';
  }

  studentBarcodeLabel(student: GroupStudent): string {
    return student.barcodeNumber?.trim() || 'Unavailable';
  }

  studentAttendanceTimeLabel(student: GroupStudent): string {
    if (this.studentStatusLabel(student) !== 'Present') {
      return 'Not recorded';
    }

    return this.extractAttendanceTime(student.attendanceTime ?? student.lastAttendance) ?? 'Not recorded';
  }

  canChangeStudentStatus(): boolean {
    const selectedSession = this.session();
    return !!selectedSession && this.sessionLiveStatus(selectedSession) === 'running';
  }

  async toggleStudentStatus(student: GroupStudent): Promise<void> {
    if (!this.groupId || this.updatingStudentAttendanceId() === student.id) {
      return;
    }
    if (!this.canChangeStudentStatus()) {
      this.barcodeScanNotification.set({
        message: 'Attendance status can only be changed while this session is running',
        state: 'error',
      });
      return;
    }

    const attendanceState = this.studentStatusLabel(student) === 'Present' ? 'Absent' : 'Present';
    this.updatingStudentAttendanceId.set(student.id);
    this.barcodeScanNotification.set(null);
    try {
      const response = await firstValueFrom(
        this.attendanceData.saveManualAttendance({
          groupId: this.groupId,
          studentId: student.id,
          attendanceState,
        }),
      );
      this.mergeManualStudentAttendance(response.studentId, response.attendanceState, response.source, response.scanTime);
      this.barcodeScanNotification.set({ message: response.message, state: 'success' });
    } catch (error) {
      this.barcodeScanNotification.set({
        message: error instanceof Error ? error.message : 'Unable to update student attendance',
        state: 'error',
      });
    } finally {
      this.updatingStudentAttendanceId.set(null);
    }
  }

  onStudentSearch(value: string): void {
    this.studentSearch.set(value);
    this.studentPageIndex.set(0);
  }

  onStudentStatusFilter(value: string): void {
    this.studentStatusFilter.set(this.isStudentStatusFilter(value) ? value : 'all');
    this.studentPageIndex.set(0);
  }

  onStudentPageSize(value: string): void {
    const pageSize = Number(value);
    this.studentPageSize.set(Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 5);
    this.studentPageIndex.set(0);
  }

  previousStudentPage(): void {
    this.studentPageIndex.update((page) => Math.max(0, page - 1));
  }

  nextStudentPage(): void {
    this.studentPageIndex.update((page) => Math.min(this.studentTotalPages() - 1, page + 1));
  }

  onLessonPageSize(value: string): void {
    const pageSize = Number(value);
    this.lessonPageSize.set(Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 5);
    this.lessonPageIndex.set(0);
  }

  previousLessonPage(): void {
    this.lessonPageIndex.update((page) => Math.max(0, page - 1));
  }

  nextLessonPage(): void {
    this.lessonPageIndex.update((page) => Math.min(this.lessonTotalPages() - 1, page + 1));
  }

  onExamPageSize(value: string): void {
    const pageSize = Number(value);
    this.examPageSize.set(Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 5);
    this.examPageIndex.set(0);
  }

  previousExamPage(): void {
    this.examPageIndex.update((page) => Math.max(0, page - 1));
  }

  nextExamPage(): void {
    this.examPageIndex.update((page) => Math.min(this.examTotalPages() - 1, page + 1));
  }

  setContentTab(tab: SessionContentTab): void {
    this.activeContentTab.set(tab);
  }

  contentTabClass(tab: SessionContentTab): string {
    return this.activeContentTab() === tab
      ? 'tenant-group-session-tab tenant-group-session-tab--active'
      : 'tenant-group-session-tab';
  }

  sessionExamQueryParams(session: SessionDetailsRow): Record<string, string> {
    const params: Record<string, string> = {
      freshCreate: 'true',
      returnTo: `${this.groupListRoute}/${this.groupId}/sessions/${session.id}`,
      returnTab: 'homeWork',
      examDate: session.date,
    };
    return params;
  }

  sessionExamEditQueryParams(session: SessionDetailsRow, exam: GroupExamRow): Record<string, string> {
    const params: Record<string, string> = {
      selectedExamId: exam.examId,
      returnTo: `${this.groupListRoute}/${this.groupId}/sessions/${session.id}`,
      returnTab: 'homeWork',
      examDate: exam.date || session.date,
      examDuration: String(exam.duration),
      showResultsImmediately: String(exam.settings.showResultsImmediately),
      allowRetakes: String(exam.settings.allowRetakes),
    };
    if (exam.startTime) {
      params['examStartTime'] = exam.startTime;
    }
    if (!this.isPendingSessionExam(exam)) {
      params['assignmentId'] = exam.id;
    }
    if (exam.instructions?.trim()) {
      params['instructions'] = exam.instructions.trim();
    }
    return params;
  }

  editSessionExam(session: SessionDetailsRow, exam: GroupExamRow, event?: Event): void {
    event?.stopPropagation();
    void this.router.navigate([this.groupListRoute, this.groupId, 'exam'], {
      queryParams: this.sessionExamEditQueryParams(session, exam),
    });
  }

  async previewSessionReport(session: SessionDetailsRow): Promise<void> {
    const group = this.group();
    if (!group || this.generatingReport()) {
      return;
    }

    this.generatingReport.set(true);
    this.reportError.set(null);
    try {
      const { doc, fileName } = this.buildSessionReportDocument(group, session);
      const blob = doc.output('blob');
      const objectUrl = URL.createObjectURL(blob);
      this.clearReportPreviewObjectUrl();
      this.reportPreviewObjectUrl.set(objectUrl);
      this.reportPreviewSafeObjectUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl));
      this.reportPreviewFileName.set(fileName);
      this.reportPreviewOpen.set(true);
    } catch (error) {
      this.reportError.set(error instanceof Error ? error.message : 'Unable to generate session report');
    } finally {
      this.generatingReport.set(false);
    }
  }

  closeSessionReportPreview(): void {
    this.reportPreviewOpen.set(false);
    this.clearReportPreviewObjectUrl();
  }

  requestDeleteSessionExam(exam: GroupExamRow, event?: Event): void {
    event?.stopPropagation();
    if (this.sessionExamActionInProgress()) {
      return;
    }
    this.sessionExamActionError.set(null);
    this.pendingDeleteSessionExam.set(exam);
  }

  closeDeleteSessionExamModal(): void {
    if (this.sessionExamActionInProgress()) {
      return;
    }
    this.pendingDeleteSessionExam.set(null);
    this.sessionExamActionError.set(null);
  }

  async confirmDeleteSessionExam(): Promise<void> {
    const exam = this.pendingDeleteSessionExam();
    if (!exam || this.sessionExamActionInProgress()) {
      return;
    }
    this.deletingSessionExamId.set(exam.id);
    this.sessionExamActionError.set(null);
    try {
      await firstValueFrom(this.data.deleteGroupExam(this.groupId, exam.id));
      this.sessionExams.update((exams) => exams.filter((row) => row.id !== exam.id));
      this.pendingDeleteSessionExam.set(null);
      this.normalizeExamPageIndex();
    } catch (error) {
      this.sessionExamActionError.set(error instanceof Error ? error.message : 'Unable to delete exam');
    } finally {
      this.deletingSessionExamId.set(null);
    }
  }

  sessionExamActionInProgress(): boolean {
    return Boolean(this.deletingSessionExamId());
  }

  normalizeExamPageIndex(): void {
    this.examPageIndex.update((page) => Math.min(page, this.examTotalPages() - 1));
  }

  requestDeleteLessonFromSession(lesson: GroupLesson, event?: Event): void {
    event?.stopPropagation();
    if (this.lessonDeleteInProgress() || lesson.completed) {
      return;
    }
    this.sessionLessonActionError.set(null);
    this.pendingDeleteSessionLesson.set({ kind: 'lesson', item: lesson });
  }

  requestDeleteSessionLibraryContent(content: GroupSessionLibraryContent, event?: Event): void {
    event?.stopPropagation();
    if (this.lessonDeleteInProgress() || content.completed) {
      return;
    }
    this.sessionLessonActionError.set(null);
    this.pendingDeleteSessionLesson.set({ kind: 'library', item: content });
  }

  closeDeleteSessionLessonModal(): void {
    if (this.lessonDeleteInProgress()) {
      return;
    }
    this.pendingDeleteSessionLesson.set(null);
    this.sessionLessonActionError.set(null);
  }

  async confirmDeleteSessionLesson(): Promise<void> {
    const pending = this.pendingDeleteSessionLesson();
    if (!pending || this.lessonDeleteInProgress()) {
      return;
    }

    this.sessionLessonActionError.set(null);
    try {
      if (pending.kind === 'lesson') {
        await this.removeLessonFromSession(pending.item);
      } else {
        await this.removeSessionLibraryContent(pending.item);
      }
      this.pendingDeleteSessionLesson.set(null);
    } catch (error) {
      this.sessionLessonActionError.set(error instanceof Error ? error.message : 'Unable to delete lesson');
    }
  }

  lessonDeleteInProgress(): boolean {
    return Boolean(this.removingLessonId());
  }

  pendingSessionLessonTitle(pending: PendingDeleteSessionLesson): string {
    return pending.item.title;
  }

  pendingSessionLessonMeta(pending: PendingDeleteSessionLesson): string {
    if (pending.kind === 'lesson') {
      return pending.item.path || pending.item.curriculumNodeId;
    }
    return `${pending.item.folderName} · ${this.materialTypeLabel(pending.item.contentType)}`;
  }

  async openLessonPicker(): Promise<void> {
    this.lessonPickerOpen.set(true);
    this.lessonPickerError.set(null);
    if (this.lessonCurriculumRoot() || this.lessonPickerLoading()) {
      return;
    }

    const group = this.group();
    if (!group?.subjectId) {
      this.lessonPickerError.set('This group is not linked to a subject curriculum.');
      return;
    }

    this.lessonPickerLoading.set(true);
    try {
      this.lessonCurriculumRoot.set(await this.subjectsData.getSubjectCurriculumForCategory(group.subjectId, group.educationCategory));
    } catch (error) {
      this.lessonPickerError.set(error instanceof Error ? error.message : 'Unable to load curriculum lessons');
    } finally {
      this.lessonPickerLoading.set(false);
    }
  }

  closeLessonPicker(): void {
    this.lessonPickerOpen.set(false);
    this.lessonPickerError.set(null);
  }

  async openLibraryPicker(): Promise<void> {
    this.libraryPickerOpen.set(true);
    this.libraryPickerError.set(null);
    if (this.libraryFolders().length || this.libraryPickerLoading()) {
      return;
    }

    this.libraryPickerLoading.set(true);
    try {
      this.libraryFolders.set(await firstValueFrom(this.data.loadGroupLibraryFolders(this.groupId, { scope: this.detailScope })));
    } catch (error) {
      this.libraryPickerError.set(error instanceof Error ? error.message : 'Unable to load library folders');
      this.libraryFolders.set([]);
    } finally {
      this.libraryPickerLoading.set(false);
    }
  }

  closeLibraryPicker(): void {
    this.libraryPickerOpen.set(false);
    this.libraryPickerError.set(null);
  }

  async selectLibraryFolder(folder: TenantCurriculumMaterialFolder): Promise<void> {
    this.selectedLibraryFolder.set(folder);
    await this.expandLibraryFolder(folder);
  }

  async chooseLibraryFolder(): Promise<void> {
    if (!this.selectedLibraryItemCount()) {
      return;
    }
    this.libraryPickerError.set(null);
    try {
      const savedContent = await Promise.all(
        this.selectedLibraryItemsAsContent().map((content) =>
          firstValueFrom(this.data.addGroupSessionLibraryContent(this.groupId, {
            sessionId: this.sessionId,
            folderId: content.folderId,
            contentType: content.contentType,
            contentId: content.contentId,
          })),
        ),
      );
      this.sessionLibraryContent.update((content) => this.mergeSessionLibraryContent(content, savedContent));
      this.selectedLibraryFileIds.set(new Set());
      this.selectedLibraryNoteIds.set(new Set());
      this.libraryPickerOpen.set(false);
    } catch (error) {
      this.libraryPickerError.set(error instanceof Error ? error.message : 'Unable to insert library content');
    }
  }

  async toggleLibraryFolder(folder: TenantCurriculumMaterialFolder): Promise<void> {
    this.selectedLibraryFolder.set(folder);
    if (this.isLibraryFolderExpanded(folder)) {
      this.collapseLibraryFolder(folder);
      return;
    }
    await this.expandLibraryFolder(folder);
  }

  async expandLibraryFolder(folder: TenantCurriculumMaterialFolder): Promise<void> {
    this.expandedLibraryFolderIds.update((folderIds) => {
      const next = new Set(folderIds);
      next.add(folder.id);
      return next;
    });
    await this.loadLibraryFolderContent(folder.id);
  }

  collapseLibraryFolder(folder: TenantCurriculumMaterialFolder): void {
    this.expandedLibraryFolderIds.update((folderIds) => {
      const next = new Set(folderIds);
      next.delete(folder.id);
      return next;
    });
  }

  isLibraryFolderExpanded(folder: TenantCurriculumMaterialFolder): boolean {
    return this.expandedLibraryFolderIds().has(folder.id);
  }

  libraryFolderFiles(folder: TenantCurriculumMaterialFolder): TenantCurriculumMaterialFile[] {
    return this.libraryFilesByFolderId().get(folder.id) ?? [];
  }

  libraryFolderNotes(folder: TenantCurriculumMaterialFolder): TenantCurriculumMaterialNote[] {
    return this.libraryNotesByFolderId().get(folder.id) ?? [];
  }

  hasLibraryFolderContent(folder: TenantCurriculumMaterialFolder): boolean {
    return Boolean(this.libraryFolderFiles(folder).length || this.libraryFolderNotes(folder).length);
  }

  isLibraryFolderLoading(folder: TenantCurriculumMaterialFolder): boolean {
    return this.libraryFileLoadingIds().has(folder.id);
  }

  libraryFolderError(folder: TenantCurriculumMaterialFolder): string | null {
    return this.libraryFileErrors().get(folder.id) ?? null;
  }

  toggleLibraryFileSelection(file: TenantCurriculumMaterialFile): void {
    this.selectedLibraryFileIds.update((fileIds) => {
      const next = new Set(fileIds);
      if (next.has(file.id)) {
        next.delete(file.id);
      } else {
        next.add(file.id);
      }
      return next;
    });
  }

  isLibraryFileSelected(file: TenantCurriculumMaterialFile): boolean {
    return this.selectedLibraryFileIds().has(file.id);
  }

  toggleLibraryNoteSelection(note: TenantCurriculumMaterialNote): void {
    this.selectedLibraryNoteIds.update((noteIds) => {
      const next = new Set(noteIds);
      if (next.has(note.id)) {
        next.delete(note.id);
      } else {
        next.add(note.id);
      }
      return next;
    });
  }

  isLibraryNoteSelected(note: TenantCurriculumMaterialNote): boolean {
    return this.selectedLibraryNoteIds().has(note.id);
  }

  openSessionLibraryContentPreview(content: GroupSessionLibraryContent): void {
    this.clearPreviewObjectUrl();
    this.previewContent.set(content);
    this.previewNote.set(null);
    this.previewError.set(null);
    if (content.contentType === 'NOTE') {
      void this.loadSessionLibraryNotePreview(content);
      return;
    }
    if (this.canPreviewContent(content)) {
      void this.loadPreviewFile(content);
      return;
    }
    this.previewLoading.set(false);
  }

  async removeSessionLibraryContent(content: GroupSessionLibraryContent): Promise<void> {
    if (this.removingLessonId() || content.completed) {
      return;
    }

    this.removingLessonId.set(content.id);
    this.lessonsError.set(null);
    try {
      await firstValueFrom(this.data.deleteGroupSessionLibraryContent(this.groupId, content.id));
      this.sessionLibraryContent.update((items) => items.filter((item) => item.id !== content.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to remove library content';
      this.lessonsError.set(message);
      throw new Error(message);
    } finally {
      this.removingLessonId.set(null);
    }
  }

  async toggleSessionLibraryContentCompletion(content: GroupSessionLibraryContent): Promise<void> {
    if (this.updatingLessonCompletionId()) {
      return;
    }

    this.updatingLessonCompletionId.set(content.id);
    this.lessonsError.set(null);
    try {
      const updatedContent = await firstValueFrom(this.data.updateGroupSessionLibraryContentCompletion(this.groupId, content.id, !content.completed));
      this.sessionLibraryContent.update((items) => this.mergeSessionLibraryContent(items, [updatedContent]));
    } catch (error) {
      this.lessonsError.set(error instanceof Error ? error.message : 'Unable to update library content');
    } finally {
      this.updatingLessonCompletionId.set(null);
    }
  }

  async publishSession(): Promise<void> {
    if (this.publishingSession()) {
      return;
    }
    this.publishSessionMessage.set(null);
    this.publishSessionError.set(null);
    if (!this.canPublishSelectedSession()) {
      this.publishSessionError.set('Session media can be published after the session starts.');
      return;
    }

    this.publishingSession.set(true);
    try {
      const publication = await firstValueFrom(this.data.publishGroupSession(this.groupId, this.sessionId));
      this.sessionPublication.set(publication);
      this.publishSessionMessage.set(`${publication.mediaCount} session media ${publication.mediaCount === 1 ? 'item' : 'items'} published for students.`);
    } catch (error) {
      this.publishSessionError.set(error instanceof Error ? error.message : 'Unable to publish session');
    } finally {
      this.publishingSession.set(false);
    }
  }

  openTeacherAbsence(): void {
    this.teacherAbsenceOpen.set(true);
    this.teacherAbsenceOptionsOpen.set(false);
    this.teacherReplacementOpen.set(false);
    this.teacherAbsenceError.set(null);
    this.teacherAbsenceSuccess.set(null);
    this.teacherAbsenceReason.set('');
  }

  closeTeacherAbsenceModals(): void {
    if (this.teacherAbsenceSaving() || this.replacementTeacherSaving()) {
      return;
    }
    this.teacherAbsenceOpen.set(false);
    this.teacherAbsenceOptionsOpen.set(false);
    this.teacherReplacementOpen.set(false);
    this.teacherAbsenceError.set(null);
  }

  onTeacherAbsenceReason(value: string): void {
    this.teacherAbsenceReason.set(value);
  }

  onReplacementTeacher(value: string): void {
    this.selectedReplacementTeacherId.set(value);
  }

  async saveTeacherAbsence(): Promise<void> {
    if (this.teacherAbsenceSaving()) {
      return;
    }
    this.teacherAbsenceSaving.set(true);
    this.teacherAbsenceError.set(null);
    this.teacherAbsenceSuccess.set(null);
    try {
      const result = await firstValueFrom(this.data.recordSessionTeacherAbsence(this.groupId, this.sessionId, {
        reason: this.teacherAbsenceReason().trim() || null,
      }));
      this.teacherAbsence.set(result);
      this.teacherAbsenceOpen.set(false);
      this.teacherAbsenceOptionsOpen.set(true);
      this.teacherAbsenceSuccess.set(result.message || 'Teacher absence recorded.');
    } catch (error) {
      this.teacherAbsenceError.set(error instanceof Error ? error.message : 'Unable to record teacher absence');
    } finally {
      this.teacherAbsenceSaving.set(false);
    }
  }

  continueTeacherAbsenceWithPostpone(): void {
    this.teacherAbsenceOptionsOpen.set(false);
    this.openPostponeChoices();
  }

  async openTeacherReplacement(): Promise<void> {
    this.teacherAbsenceOptionsOpen.set(false);
    this.teacherReplacementOpen.set(true);
    this.teacherAbsenceError.set(null);
    this.selectedReplacementTeacherId.set('');
    this.replacementTeachersLoading.set(true);
    try {
      const teachers = await firstValueFrom(this.data.loadAvailableReplacementTeachers(this.groupId, this.sessionId));
      this.replacementTeachers.set(teachers);
      this.selectedReplacementTeacherId.set(teachers[0]?.id ?? '');
    } catch (error) {
      this.replacementTeachers.set([]);
      this.teacherAbsenceError.set(error instanceof Error ? error.message : 'Unable to load replacement teachers');
    } finally {
      this.replacementTeachersLoading.set(false);
    }
  }

  async saveReplacementTeacher(): Promise<void> {
    const teacherId = this.selectedReplacementTeacherId().trim();
    if (!teacherId || this.replacementTeacherSaving()) {
      return;
    }
    this.replacementTeacherSaving.set(true);
    this.teacherAbsenceError.set(null);
    this.teacherAbsenceSuccess.set(null);
    try {
      const result = await firstValueFrom(this.data.replaceSessionTeacher(this.groupId, this.sessionId, {
        replacementTeacherId: teacherId,
        reason: this.teacherAbsenceReason().trim() || null,
      }));
      this.teacherAbsence.set(result);
      this.teacherReplacementOpen.set(false);
      this.teacherAbsenceSuccess.set(result.message || 'Replacement teacher saved.');
    } catch (error) {
      this.teacherAbsenceError.set(error instanceof Error ? error.message : 'Unable to replace session teacher');
    } finally {
      this.replacementTeacherSaving.set(false);
    }
  }

  openPostponeChoices(): void {
    const selectedSession = this.session();
    this.postponeSuccess.set(null);
    this.postponeError.set(selectedSession?.kind === 'dated' ? null : 'Only dated sessions can be postponed.');
    this.postponeChoiceOpen.set(true);
  }

  closePostponeModals(): void {
    if (this.postponeSubmitting()) {
      return;
    }
    this.postponeChoiceOpen.set(false);
    this.postponeAppointmentOpen.set(false);
    this.postponeReplaceOpen.set(false);
    this.postponeError.set(null);
    this.postponeLoadingAvailability.set(false);
  }

  openPostponeAppointment(): void {
    const selectedSession = this.session();
    if (!selectedSession) {
      return;
    }
    this.postponeChoiceOpen.set(false);
    this.postponeAppointmentOpen.set(true);
    this.postponeReplaceOpen.set(false);
    this.postponeError.set(null);
    this.postponeSuccess.set(null);
    this.postponeAppointmentDate.set(selectedSession.date || '');
    this.postponeAppointmentTime.set(selectedSession.startTime || '');
    this.postponeAppointmentRoomId.set('');
    this.postponeReason.set('');
    void this.loadPostponeAvailability();
  }

  openReplaceSchedule(): void {
    this.postponeChoiceOpen.set(false);
    this.postponeAppointmentOpen.set(false);
    this.postponeReplaceOpen.set(true);
    this.postponeError.set(null);
    this.postponeSuccess.set(null);
    this.postponeReason.set('');
  }

  onPostponeAppointmentDate(value: string): void {
    this.postponeAppointmentDate.set(value);
    this.postponeAppointmentRoomId.set('');
    void this.loadPostponeAvailability();
  }

  onPostponeAppointmentTime(value: string): void {
    this.postponeAppointmentTime.set(value);
    this.postponeAppointmentRoomId.set('');
    void this.loadPostponeAvailability();
  }

  onPostponeAppointmentRoom(value: string): void {
    this.postponeAppointmentRoomId.set(value);
  }

  onPostponeReason(value: string): void {
    this.postponeReason.set(value);
  }

  async loadPostponeAvailability(): Promise<void> {
    const date = this.postponeAppointmentDate().trim();
    const startTime = this.postponeAppointmentTime().trim();
    if (!date || !startTime) {
      this.postponeAvailability.set(null);
      return;
    }
    this.postponeLoadingAvailability.set(true);
    this.postponeError.set(null);
    try {
      const availability = await firstValueFrom(this.data.loadSessionPostponeAvailability(this.groupId, this.sessionId, date, startTime));
      this.postponeAvailability.set(availability);
      if (!availability.rooms.some((room) => room.id === this.postponeAppointmentRoomId() && room.available)) {
        this.postponeAppointmentRoomId.set(availability.rooms.find((room) => room.available)?.id ?? '');
      }
    } catch (error) {
      this.postponeAvailability.set(null);
      this.postponeError.set(error instanceof Error ? error.message : 'Unable to load appointment availability');
    } finally {
      this.postponeLoadingAvailability.set(false);
    }
  }

  async submitPostponeAppointment(): Promise<void> {
    if (!this.canConfirmPostponeAppointment() || this.postponeSubmitting()) {
      return;
    }
    await this.loadPostponeAvailability();
    if (!this.canConfirmPostponeAppointment()) {
      this.postponeError.set('Selected room is no longer available. Choose another available room.');
      return;
    }
    await this.submitPostponement({
      method: 'BOOK_APPOINTMENT',
      date: this.postponeAppointmentDate(),
      startTime: this.postponeAppointmentTime(),
      roomId: this.postponeAppointmentRoomId(),
      reason: this.postponeReason().trim() || null,
    });
  }

  async submitReplaceSchedule(): Promise<void> {
    if (this.postponeSubmitting()) {
      return;
    }
    await this.submitPostponement({
      method: 'REPLACE_SCHEDULE',
      reason: this.postponeReason().trim() || null,
    });
  }

  private async submitPostponement(payload: {
    method: 'BOOK_APPOINTMENT' | 'REPLACE_SCHEDULE';
    date?: string | null;
    startTime?: string | null;
    roomId?: string | null;
    reason?: string | null;
  }): Promise<void> {
    this.postponeSubmitting.set(true);
    this.postponeError.set(null);
    this.postponeSuccess.set(null);
    try {
      const result = await firstValueFrom(this.data.postponeGroupSession(this.groupId, this.sessionId, payload));
      this.postponeSuccess.set(result);
      await this.refreshAfterPostponement(result);
    } catch (error) {
      this.postponeError.set(error instanceof Error ? error.message : 'Unable to postpone session');
    } finally {
      this.postponeSubmitting.set(false);
    }
  }

  private async refreshAfterPostponement(result: GroupSessionPostponeResult): Promise<void> {
    this.postponeChoiceOpen.set(false);
    this.postponeAppointmentOpen.set(false);
    this.postponeReplaceOpen.set(false);
    if (result.newSessionId) {
      await this.router.navigate([this.groupListRoute, this.groupId, 'sessions', result.newSessionId]);
      return;
    }
    await this.loadSessionData();
  }

  private async loadSessionData(): Promise<void> {
    await this.loadGroup();
    await this.loadSessionTeacherAbsence();
    await this.loadLessons();
    await this.loadSessionExams();
    await this.loadSessionLibraryContent();
    await this.loadSessionPublication();
  }

  private async loadSessionTeacherAbsence(): Promise<void> {
    if (this.isTeacherGroupView) {
      this.teacherAbsence.set(null);
      return;
    }
    try {
      const absence = await firstValueFrom(this.data.loadSessionTeacherAbsence(this.groupId, this.sessionId));
      this.teacherAbsence.set(absence);
    } catch {
      this.teacherAbsence.set(null);
    }
  }

  private resetSessionScopedState(): void {
    this.lessons.set([]);
    this.sessionExams.set([]);
    this.pendingDeleteSessionExam.set(null);
    this.deletingSessionExamId.set(null);
    this.sessionExamActionError.set(null);
    this.pendingDeleteSessionLesson.set(null);
    this.sessionLessonActionError.set(null);
    this.sessionLibraryContent.set([]);
    this.sessionPublication.set(null);
    this.publishSessionMessage.set(null);
    this.publishSessionError.set(null);
    this.reportError.set(null);
    this.reportPreviewOpen.set(false);
    this.clearReportPreviewObjectUrl();
    this.postponeChoiceOpen.set(false);
    this.postponeAppointmentOpen.set(false);
    this.postponeReplaceOpen.set(false);
    this.postponeAvailability.set(null);
    this.postponeError.set(null);
    this.postponeSuccess.set(null);
    this.postponeAppointmentRoomId.set('');
    this.teacherAbsenceOpen.set(false);
    this.teacherAbsenceOptionsOpen.set(false);
    this.teacherReplacementOpen.set(false);
    this.teacherAbsence.set(null);
    this.teacherAbsenceReason.set('');
    this.teacherAbsenceError.set(null);
    this.teacherAbsenceSuccess.set(null);
    this.replacementTeachers.set([]);
    this.selectedReplacementTeacherId.set('');
  }

  onLessonPickerSearch(value: string): void {
    this.lessonPickerSearch.set(value);
  }

  onLessonPickerStatusFilter(value: string): void {
    this.lessonPickerStatusFilter.set(this.isLessonPickerStatusFilter(value) ? value : 'all');
  }

  isCurriculumLessonInserted(lesson: CurriculumLessonOption): boolean {
    return this.lessons().some((currentLesson) => currentLesson.curriculumNodeId === lesson.id);
  }

  async addLessonFromCurriculum(lesson: CurriculumLessonOption): Promise<void> {
    if (this.isCurriculumLessonInserted(lesson) || this.savingLessonNodeId()) {
      return;
    }
    this.savingLessonNodeId.set(lesson.id);
    this.lessonPickerError.set(null);
    try {
      const savedLesson = await firstValueFrom(this.data.addGroupLesson(this.groupId, lesson.id, { sessionId: this.sessionId }));
      this.lessons.update((lessons) => this.mergeGroupLessons(lessons, [savedLesson]));
      this.lessonPageIndex.set(Math.max(0, Math.ceil(this.lessons().length / this.lessonPageSize()) - 1));
      this.lessonPickerOpen.set(false);
    } catch (error) {
      this.lessonPickerError.set(error instanceof Error ? error.message : 'Unable to insert lesson');
    } finally {
      this.savingLessonNodeId.set(null);
    }
  }

  async removeLessonFromSession(lesson: GroupLesson): Promise<void> {
    if (this.removingLessonId() || lesson.completed) {
      return;
    }

    this.removingLessonId.set(lesson.id);
    this.lessonsError.set(null);
    try {
      await firstValueFrom(this.data.deleteGroupLesson(this.groupId, lesson.id));
      this.lessons.update((lessons) => lessons.filter((currentLesson) => currentLesson.id !== lesson.id));
      this.expandedLessonIds.update((expandedLessonIds) => {
        const next = new Set(expandedLessonIds);
        next.delete(lesson.id);
        return next;
      });
      this.lessonContentByLessonId.update((contentByLessonId) => {
        const next = new Map(contentByLessonId);
        next.delete(lesson.id);
        return next;
      });
      this.lessonContentErrors.update((errors) => {
        const next = new Map(errors);
        next.delete(lesson.id);
        return next;
      });
      this.selectedLessonContentByLessonId.update((selectedContent) => {
        const next = new Map(selectedContent);
        next.delete(lesson.id);
        return next;
      });
      this.lessonPageIndex.update((page) => Math.min(page, this.lessonTotalPages() - 1));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to remove lesson';
      this.lessonsError.set(message);
      throw new Error(message);
    } finally {
      this.removingLessonId.set(null);
    }
  }

  async toggleLessonCompletion(lesson: GroupLesson): Promise<void> {
    if (this.updatingLessonCompletionId()) {
      return;
    }

    this.updatingLessonCompletionId.set(lesson.id);
    this.lessonsError.set(null);
    try {
      const updatedLesson = await firstValueFrom(this.data.updateGroupLessonCompletion(this.groupId, lesson.id, !lesson.completed));
      this.lessons.update((lessons) => this.mergeGroupLessons(lessons, [updatedLesson]));
    } catch (error) {
      this.lessonsError.set(error instanceof Error ? error.message : 'Unable to update lesson completion');
    } finally {
      this.updatingLessonCompletionId.set(null);
    }
  }

  lessonPageStart(): number {
    return this.lessons().length ? this.lessonPageIndex() * this.lessonPageSize() + 1 : 0;
  }

  lessonPageEnd(): number {
    return Math.min(this.lessons().length, (this.lessonPageIndex() + 1) * this.lessonPageSize());
  }

  examPageStart(): number {
    return this.assignedSessionExams().length ? this.examPageIndex() * this.examPageSize() + 1 : 0;
  }

  examPageEnd(): number {
    return Math.min(this.assignedSessionExams().length, (this.examPageIndex() + 1) * this.examPageSize());
  }

  examTimeLabel(exam: GroupExamRow): string {
    return exam.startTime ? `${this.displayMeridiemTime(exam.startTime)} start` : 'Anytime';
  }

  examDurationLabel(exam: GroupExamRow): string {
    return `${exam.duration} min`;
  }

  examQuestionCountLabel(exam: GroupExamRow): string {
    if (exam.questionCount == null) {
      return 'Questions not counted';
    }
    return exam.questionCount === 1 ? '1 question' : `${exam.questionCount} questions`;
  }

  examSettingsLabel(exam: GroupExamRow): string {
    const settings = [
      exam.settings.showResultsImmediately ? 'Instant results' : null,
      exam.settings.allowRetakes ? 'Retakes' : null,
    ].filter((value): value is string => Boolean(value));
    return settings.length ? settings.join(', ') : 'Standard';
  }

  isLessonExpanded(lesson: GroupLesson): boolean {
    return this.expandedLessonIds().has(lesson.id);
  }

  toggleLessonExpansion(lesson: GroupLesson): void {
    const willExpand = !this.expandedLessonIds().has(lesson.id);
    this.expandedLessonIds.update((expandedLessonIds) => {
      const next = new Set(expandedLessonIds);
      if (next.has(lesson.id)) {
        next.delete(lesson.id);
      } else {
        next.add(lesson.id);
      }
      return next;
    });
    if (willExpand) {
      void this.loadLessonContent(lesson);
    }
  }

  lessonContent(lesson: GroupLesson): GroupLessonContent[] {
    return this.lessonContentByLessonId().get(lesson.id) ?? [];
  }

  isLessonContentLoading(lesson: GroupLesson): boolean {
    return this.lessonContentLoadingIds().has(lesson.id);
  }

  lessonContentError(lesson: GroupLesson): string | null {
    return this.lessonContentErrors().get(lesson.id) ?? null;
  }

  materialIcon(content: Pick<GroupLessonContent, 'contentType' | 'fileContentType' | 'title'>): string {
    if (content.contentType === 'NOTE') {
      return 'sticky_note_2';
    }
    if (content.contentType === 'LINK') {
      return 'link';
    }
    const contentType = content.fileContentType?.toLowerCase() ?? '';
    if (contentType.startsWith('image/')) {
      return 'image';
    }
    if (contentType.includes('pdf')) {
      return 'picture_as_pdf';
    }
    if (contentType.includes('video')) {
      return 'movie';
    }
    return 'description';
  }

  libraryFileIcon(file: TenantCurriculumMaterialFile): string {
    const contentType = file.contentType?.toLowerCase() ?? '';
    if (contentType.startsWith('image/')) {
      return 'image';
    }
    if (contentType.includes('pdf')) {
      return 'picture_as_pdf';
    }
    if (contentType.includes('video')) {
      return 'movie';
    }
    return 'description';
  }

  materialTypeLabel(type: GroupLessonContent['contentType']): string {
    const labels: Record<GroupLessonContent['contentType'], string> = {
      FILE: 'File',
      NOTE: 'Note',
      LINK: 'Link',
    };
    return labels[type];
  }

  formatBytes(size: number | null | undefined): string {
    if (!size) {
      return '';
    }
    if (size < 1024) {
      return `${size} B`;
    }
    if (size < 1024 * 1024) {
      return `${Math.round(size / 1024)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  selectedLessonContent(lesson: GroupLesson): GroupLessonContent | null {
    return this.selectedLessonContentByLessonId().get(lesson.id) ?? this.lessonContent(lesson)[0] ?? null;
  }

  selectLessonContent(lesson: GroupLesson, content: GroupLessonContent): void {
    this.selectedLessonContentByLessonId.update((selectedByLessonId) => {
      const next = new Map(selectedByLessonId);
      next.set(lesson.id, content);
      return next;
    });
  }

  openLessonContentPreview(lesson: GroupLesson, content: GroupLessonContent): void {
    this.selectLessonContent(lesson, content);
    this.clearPreviewObjectUrl();
    this.previewContent.set(content);
    this.previewNote.set(null);
    this.previewError.set(null);
    if (content.contentType === 'NOTE') {
      void this.loadPreviewNote(content);
      return;
    }
    if (this.canPreviewContent(content)) {
      void this.loadPreviewFile(content);
      return;
    }
    this.previewLoading.set(false);
  }

  closeLessonContentPreview(): void {
    this.previewContent.set(null);
    this.previewNote.set(null);
    this.previewLoading.set(false);
    this.previewError.set(null);
    this.clearPreviewObjectUrl();
  }

  isSelectedLessonContent(lesson: GroupLesson, content: GroupLessonContent): boolean {
    return this.selectedLessonContent(lesson)?.id === content.id;
  }

  canPreviewContent(content: Pick<PreviewableLessonContent, 'url' | 'fileContentType' | 'title'>): boolean {
    return Boolean(content.url && (this.isImageContent(content) || this.isVideoContent(content) || this.isPdfContent(content)));
  }

  isImageContent(content: Pick<PreviewableLessonContent, 'fileContentType' | 'title'>): boolean {
    const type = content.fileContentType?.toLowerCase() ?? '';
    const title = content.title.toLowerCase();
    return type.startsWith('image/') || /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(title);
  }

  isVideoContent(content: Pick<PreviewableLessonContent, 'fileContentType' | 'title'>): boolean {
    const type = content.fileContentType?.toLowerCase() ?? '';
    const title = content.title.toLowerCase();
    return type.startsWith('video/') || /\.(m4v|mov|mp4|mpeg|mpg|ogg|ogv|webm)$/i.test(title);
  }

  isPdfContent(content: Pick<PreviewableLessonContent, 'fileContentType' | 'title'>): boolean {
    const type = content.fileContentType?.toLowerCase() ?? '';
    return type.includes('pdf') || content.title.toLowerCase().endsWith('.pdf');
  }

  safeContentUrl(content: Pick<PreviewableLessonContent, 'url'>): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(content.url ?? '');
  }

  notePreviewBlocks(note: TenantCurriculumMaterialNote | null): string[] {
    const blocks = this.parseNoteContent(note?.contentJson).blocks ?? [];
    const lines = blocks
      .flatMap((block) => this.noteBlockLines(block))
      .map((line) => this.stripHtml(line).trim())
      .filter(Boolean);
    return lines.length ? lines : ['No text in this note yet.'];
  }

  onBarcodeInput(value: string): void {
    this.barcodeInputValue.set(value);
  }

  async submitBarcodeScan(): Promise<void> {
    const barcodeNumber = this.barcodeInputValue().trim();
    if (!barcodeNumber) {
      this.barcodeScanNotification.set({ message: 'Barcode number is required', state: 'error' });
      this.focusBarcodeInput();
      return;
    }

    this.barcodeScanInProgress.set(true);
    this.barcodeScanNotification.set(null);
    try {
      const response = await firstValueFrom(this.attendanceData.scanBarcode({ barcodeNumber, selectedGroupId: this.groupId }));
      this.handleBarcodeScanResponse(response);
    } catch (error) {
      this.barcodeScanNotification.set({
        message: error instanceof Error ? error.message : 'Unable to record barcode attendance',
        state: 'error',
      });
    } finally {
      this.barcodeScanInProgress.set(false);
      this.focusBarcodeInput();
    }
  }

  hiddenStudentsCount(): number {
    return Math.max(0, this.filteredSessionStudents().length - this.visibleSessionStudents().length);
  }

  private async loadGroup(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      this.group.set(await firstValueFrom(this.data.loadGroupById(this.groupId, { sessionId: this.sessionId, scope: this.detailScope })));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load session details');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async refreshGroup(): Promise<void> {
    if (this.refreshingGroup || this.isLoading()) {
      return;
    }

    this.refreshingGroup = true;
    try {
      this.group.set(await firstValueFrom(this.data.loadGroupById(this.groupId, { sessionId: this.sessionId, scope: this.detailScope })));
      this.error.set(null);
    } catch {
      // Keep the current session visible if a background refresh fails.
    } finally {
      this.refreshingGroup = false;
    }
  }

  private async loadLessons(): Promise<void> {
    this.lessonsLoading.set(true);
    this.lessonsError.set(null);
    try {
      this.lessons.set(await firstValueFrom(this.data.loadGroupLessons(this.groupId, { sync: false, sessionId: this.sessionId, scope: this.detailScope })));
    } catch (error) {
      this.lessonsError.set(error instanceof Error ? error.message : 'Unable to load lessons');
    } finally {
      this.lessonsLoading.set(false);
    }
  }

  private async loadSessionExams(): Promise<void> {
    this.sessionExamsLoading.set(true);
    this.sessionExamsError.set(null);
    try {
      const exams = await firstValueFrom(this.data.loadGroupExams(this.groupId, { scope: this.detailScope }));
      this.sessionExams.set(this.mergePendingSessionHomeWork(exams));
      this.examPageIndex.set(0);
    } catch (error) {
      this.sessionExamsError.set(error instanceof Error ? error.message : 'Unable to load session exams');
    } finally {
      this.sessionExamsLoading.set(false);
    }
  }

  private async loadSessionLibraryContent(): Promise<void> {
    if (this.isTeacherGroupView) {
      this.sessionLibraryContent.set([]);
      return;
    }
    if (!this.sessionId) {
      return;
    }

    try {
      this.sessionLibraryContent.set(await firstValueFrom(this.data.loadGroupSessionLibraryContent(this.groupId, this.sessionId)));
    } catch (error) {
      this.lessonsError.set(error instanceof Error ? error.message : 'Unable to load library content');
    }
  }

  canPublishSelectedSession(): boolean {
    const selectedSession = this.session();
    return !!selectedSession && this.sessionLiveStatus(selectedSession) !== 'coming';
  }

  private async loadSessionPublication(): Promise<void> {
    if (this.isTeacherGroupView) {
      this.sessionPublication.set(null);
      return;
    }
    if (!this.sessionId) {
      return;
    }

    try {
      const publication = await firstValueFrom(this.data.loadGroupSessionPublication(this.groupId, this.sessionId));
      const effectivePublication = this.canPublishSelectedSession()
        ? publication
        : { ...publication, published: false, mediaCount: 0, media: [] };
      this.sessionPublication.set(effectivePublication);
      this.publishSessionMessage.set(effectivePublication.published ? `${effectivePublication.mediaCount} session media ${effectivePublication.mediaCount === 1 ? 'item' : 'items'} published for students.` : null);
    } catch {
      this.sessionPublication.set(null);
    }
  }

  private async loadLibraryFolderContent(folderId: string): Promise<void> {
    if ((this.libraryFilesByFolderId().has(folderId) && this.libraryNotesByFolderId().has(folderId)) || this.libraryFileLoadingIds().has(folderId)) {
      return;
    }

    this.libraryFileLoadingIds.update((folderIds) => new Set(folderIds).add(folderId));
    this.libraryFileErrors.update((errors) => {
      const next = new Map(errors);
      next.delete(folderId);
      return next;
    });
    try {
      const [files, notes] = await Promise.all([
        firstValueFrom(this.data.loadGroupLibraryFiles(this.groupId, folderId, { scope: this.detailScope })),
        firstValueFrom(this.data.loadGroupLibraryNotes(this.groupId, folderId, { scope: this.detailScope })),
      ]);
      this.libraryFilesByFolderId.update((filesByFolderId) => {
        const next = new Map(filesByFolderId);
        next.set(folderId, files);
        return next;
      });
      this.libraryNotesByFolderId.update((notesByFolderId) => {
        const next = new Map(notesByFolderId);
        next.set(folderId, notes);
        return next;
      });
    } catch (error) {
      this.libraryFileErrors.update((errors) => {
        const next = new Map(errors);
        next.set(folderId, error instanceof Error ? error.message : 'Unable to load folder content');
        return next;
      });
    } finally {
      this.libraryFileLoadingIds.update((folderIds) => {
        const next = new Set(folderIds);
        next.delete(folderId);
        return next;
      });
    }
  }

  private selectedLibraryItemsAsContent(): GroupSessionLibraryContent[] {
    const selectedFileIds = this.selectedLibraryFileIds();
    const selectedNoteIds = this.selectedLibraryNoteIds();
    if (!selectedFileIds.size && !selectedNoteIds.size) {
      return [];
    }

    const folderById = new Map(this.libraryFolders().map((folder) => [folder.id, folder]));
    const content: GroupSessionLibraryContent[] = [];
    for (const [folderId, files] of this.libraryFilesByFolderId()) {
      const folder = folderById.get(folderId);
      for (const file of files) {
        if (!selectedFileIds.has(file.id)) {
          continue;
        }
        content.push({
          id: `library-file-${file.id}`,
          sessionId: this.sessionId ?? '',
          folderId,
          folderName: folder?.name ?? 'Library',
          contentType: 'FILE',
          contentId: file.id,
          title: file.originalName || file.fileName,
          url: file.url,
          fileContentType: file.contentType,
          sizeBytes: file.sizeBytes,
          completed: false,
        });
      }
    }
    for (const [folderId, notes] of this.libraryNotesByFolderId()) {
      const folder = folderById.get(folderId);
      for (const note of notes) {
        if (!selectedNoteIds.has(note.id)) {
          continue;
        }
        content.push({
          id: `library-note-${note.id}`,
          sessionId: this.sessionId ?? '',
          folderId,
          folderName: folder?.name ?? 'Library',
          contentType: 'NOTE',
          contentId: note.id,
          title: note.title,
          url: null,
          fileContentType: null,
          sizeBytes: null,
          completed: false,
        });
      }
    }
    return content;
  }

  private findLibraryNote(content: GroupSessionLibraryContent): TenantCurriculumMaterialNote | null {
    return this.libraryNotesByFolderId().get(content.folderId)?.find((note) => note.id === content.contentId) ?? null;
  }

  private async loadSessionLibraryNotePreview(content: GroupSessionLibraryContent): Promise<void> {
    const cachedNote = this.findLibraryNote(content);
    if (cachedNote) {
      this.previewNote.set(cachedNote);
      this.previewLoading.set(false);
      return;
    }

    this.previewLoading.set(true);
    try {
      const notes = await firstValueFrom(this.data.loadGroupLibraryNotes(this.groupId, content.folderId, { scope: this.detailScope }));
      this.libraryNotesByFolderId.update((notesByFolderId) => {
        const next = new Map(notesByFolderId);
        next.set(content.folderId, notes);
        return next;
      });
      const note = notes.find((candidate) => candidate.id === content.contentId) ?? null;
      this.previewNote.set(note);
      if (!note) {
        this.previewError.set('Unable to find this note in the library folder.');
      }
    } catch (error) {
      this.previewError.set(error instanceof Error ? error.message : 'Unable to load note content');
    } finally {
      this.previewLoading.set(false);
    }
  }

  private async loadLessonContent(lesson: GroupLesson): Promise<void> {
    if (this.lessonContentByLessonId().has(lesson.id) || this.lessonContentLoadingIds().has(lesson.id)) {
      return;
    }

    this.lessonContentLoadingIds.update((loadingIds) => new Set(loadingIds).add(lesson.id));
    this.lessonContentErrors.update((errors) => {
      const next = new Map(errors);
      next.delete(lesson.id);
      return next;
    });
    try {
      const [insertedContent, materialContent] = await Promise.all([
        firstValueFrom(this.data.loadGroupLessonContent(this.groupId, lesson.id, { scope: this.detailScope })),
        this.loadLessonMaterialContent(lesson),
      ]);
      const content = this.mergeContentList(insertedContent, materialContent);
      this.lessonContentByLessonId.update((contentByLessonId) => {
        const next = new Map(contentByLessonId);
        next.set(lesson.id, content);
        return next;
      });
      if (content.length) {
        this.selectLessonContent(lesson, content[0]);
      }
    } catch (error) {
      this.lessonContentErrors.update((errors) => {
        const next = new Map(errors);
        next.set(lesson.id, error instanceof Error ? error.message : 'Unable to load lesson content');
        return next;
      });
    } finally {
      this.lessonContentLoadingIds.update((loadingIds) => {
        const next = new Set(loadingIds);
        next.delete(lesson.id);
        return next;
      });
    }
  }

  private async loadLessonMaterialContent(lesson: GroupLesson): Promise<GroupLessonContent[]> {
    const group = this.group();
    if (!group?.subjectId || !lesson.curriculumNodeId) {
      return [];
    }
    const sources = await this.loadDirectLessonMaterialSources(group.subjectId, group.educationCategory, lesson.curriculumNodeId);
    const options = await Promise.all(sources.map((source) => this.loadMaterialOptions(group.subjectId ?? '', group.educationCategory, source)));
    return options.flat().map((option) => this.materialOptionToContent(option));
  }

  private async loadDirectLessonMaterialSources(
    subjectId: string,
    educationCategory: string | null | undefined,
    curriculumNodeId: string,
  ): Promise<LessonMaterialSource[]> {
    const root = await this.subjectsData.getSubjectCurriculumForCategory(subjectId, educationCategory);
    const lessonNode = this.findNodePath([root], curriculumNodeId)
      .filter((node) => this.isUuid(node.id))
      .at(-1);
    if (!lessonNode) {
      return [];
    }
    const folders = await this.subjectsData.listCurriculumMaterialFolders(subjectId, lessonNode.id, educationCategory);
    return folders.map((folder) => ({ nodeId: lessonNode.id, nodeLabel: lessonNode.label, folder }));
  }

  private async loadMaterialOptions(
    subjectId: string,
    educationCategory: string | null | undefined,
    source: LessonMaterialSource,
  ): Promise<LessonMaterialOption[]> {
    const [files, notes, links] = await Promise.all([
      this.subjectsData.listCurriculumMaterialFiles(subjectId, source.nodeId, source.folder.id, educationCategory),
      this.subjectsData.listCurriculumMaterialNotes(subjectId, source.nodeId, source.folder.id, educationCategory),
      this.subjectsData.listCurriculumMaterialLinks(subjectId, source.nodeId, source.folder.id, educationCategory),
    ]);
    return [
      ...files.map((file) => this.fileOption(file, source)),
      ...notes.map((note) => this.noteOption(note, source)),
      ...links.map((link) => this.linkOption(link, source)),
    ];
  }

  private fileOption(file: TenantCurriculumMaterialFile, source: LessonMaterialSource): LessonMaterialOption {
    return {
      id: file.id,
      type: 'FILE',
      title: file.originalName || file.fileName,
      url: file.url,
      fileContentType: file.contentType,
      sizeBytes: file.sizeBytes,
      source,
    };
  }

  private noteOption(note: TenantCurriculumMaterialNote, source: LessonMaterialSource): LessonMaterialOption {
    return {
      id: note.id,
      type: 'NOTE',
      title: note.title,
      url: null,
      fileContentType: null,
      sizeBytes: null,
      source,
    };
  }

  private linkOption(link: TenantCurriculumMaterialLink, source: LessonMaterialSource): LessonMaterialOption {
    return {
      id: link.id,
      type: 'LINK',
      title: link.title,
      url: link.url,
      fileContentType: null,
      sizeBytes: null,
      source,
    };
  }

  private materialOptionToContent(option: LessonMaterialOption): GroupLessonContent {
    return {
      id: `material-${option.type}-${option.source.folder.id}-${option.id}`,
      curriculumNodeId: option.source.nodeId,
      curriculumNodeLabel: option.source.nodeLabel,
      folderId: option.source.folder.id,
      folderName: option.source.folder.name,
      contentType: option.type,
      contentId: option.id,
      title: option.title,
      url: option.url ?? null,
      fileContentType: option.fileContentType ?? null,
      sizeBytes: option.sizeBytes ?? null,
    };
  }

  private mergeContentList(primary: GroupLessonContent[], material: GroupLessonContent[]): GroupLessonContent[] {
    const merged = new Map<string, GroupLessonContent>();
    for (const content of material) {
      merged.set(this.contentKey(content), content);
    }
    for (const content of primary) {
      merged.set(this.contentKey(content), content);
    }
    return Array.from(merged.values());
  }

  private mergeSessionLibraryContent(
      primary: GroupSessionLibraryContent[],
      material: GroupSessionLibraryContent[]
  ): GroupSessionLibraryContent[] {
    const merged = new Map<string, GroupSessionLibraryContent>();
    for (const content of primary) {
      merged.set(content.id, content);
    }
    for (const content of material) {
      merged.set(content.id, content);
    }
    return Array.from(merged.values());
  }

  private contentKey(content: Pick<GroupLessonContent, 'contentType' | 'contentId' | 'folderId'>): string {
    return `${content.contentType}:${content.folderId}:${content.contentId}`;
  }

  private async loadPreviewNote(content: GroupLessonContent): Promise<void> {
    this.previewLoading.set(true);
    try {
      const libraryNote = await this.loadPreviewLibraryNote(content);
      if (libraryNote) {
        this.previewNote.set(libraryNote);
        return;
      }

      const group = this.group();
      if (!group?.subjectId) {
        this.previewError.set('Unable to load this note because the group has no linked subject.');
        return;
      }
      const notes = await this.subjectsData.listCurriculumMaterialNotes(
        group.subjectId,
        content.curriculumNodeId,
        content.folderId,
        group.educationCategory,
      );
      this.previewNote.set(notes.find((note) => note.id === content.contentId) ?? null);
      if (!this.previewNote()) {
        this.previewError.set('Unable to find this note in the material folder.');
      }
    } catch (error) {
      this.previewError.set(error instanceof Error ? error.message : 'Unable to load note content');
    } finally {
      this.previewLoading.set(false);
    }
  }

  private async loadPreviewLibraryNote(content: GroupLessonContent): Promise<TenantCurriculumMaterialNote | null> {
    const cachedNotes = this.libraryNotesByFolderId().get(content.folderId);
    if (cachedNotes) {
      return cachedNotes.find((note) => note.id === content.contentId) ?? null;
    }

    try {
      const notes = await firstValueFrom(this.data.loadGroupLibraryNotes(this.groupId, content.folderId, { scope: this.detailScope }));
      this.libraryNotesByFolderId.update((notesByFolderId) => {
        const next = new Map(notesByFolderId);
        next.set(content.folderId, notes);
        return next;
      });
      return notes.find((note) => note.id === content.contentId) ?? null;
    } catch {
      return null;
    }
  }

  private async loadPreviewFile(content: Pick<PreviewableLessonContent, 'url' | 'title' | 'fileContentType'>): Promise<void> {
    if (!content.url) {
      this.previewLoading.set(false);
      return;
    }

    this.previewLoading.set(true);
    try {
      const blob = await firstValueFrom(this.http.get(content.url, { responseType: 'blob' }));
      const objectUrl = URL.createObjectURL(blob);
      this.previewObjectUrl.set(objectUrl);
      this.previewSafeObjectUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl));
      this.previewError.set(null);
    } catch (error) {
      this.previewError.set(error instanceof Error ? error.message : 'Unable to load file preview. Use Open to view this material.');
    } finally {
      this.previewLoading.set(false);
    }
  }

  private handleBarcodeScanResponse(response: TenantBarcodeAttendanceScanResponse): void {
    const accepted = response.result === 'PRESENT_RECORDED' || response.result === 'ALREADY_PRESENT';
    this.barcodeScanNotification.set({ message: response.message, state: accepted ? 'success' : 'error' });

    if (!accepted || !response.student || !response.attendance) {
      return;
    }

    this.mergeStudentAttendance(response);
    this.barcodeInputValue.set('');
    if (this.sessionBarcodeInput?.nativeElement) {
      this.sessionBarcodeInput.nativeElement.value = '';
    }
  }

  private mergeStudentAttendance(response: TenantBarcodeAttendanceScanResponse): void {
    if (!response.student || !response.attendance) {
      return;
    }

    const currentGroup = this.group();
    if (!currentGroup) {
      return;
    }

    const scannedBarcode = this.normalizeBarcodeValue(response.student.barcodeNumber);
    const students = currentGroup.students ?? [];
    const existingIndex = students.findIndex(
      (student) => student.id === response.student?.id || this.normalizeBarcodeValue(student.barcodeNumber) === scannedBarcode,
    );
    const updatedStudent: GroupStudent = {
      id: response.student.id,
      name: response.student.name,
      email: '',
      barcodeNumber: response.student.barcodeNumber,
      attendanceRate: 0,
      lastAttendance: response.attendance.scanTime,
      attendanceState: 'Present',
      attendanceSource: 'Auto',
    };
    const updatedStudents =
      existingIndex === -1
        ? [...students, updatedStudent]
        : students.map((student, index) =>
            index === existingIndex
              ? {
                  ...student,
                  name: response.student?.name ?? student.name,
                  barcodeNumber: response.student?.barcodeNumber ?? student.barcodeNumber,
                  lastAttendance: response.attendance?.scanTime ?? student.lastAttendance,
                  attendanceState: 'Present' as const,
                  attendanceSource: 'Auto' as const,
                }
              : student,
          );

    this.group.set({ ...currentGroup, students: updatedStudents });
  }

  private mergeManualStudentAttendance(
    studentId: string,
    attendanceState: 'Present' | 'Absent',
    attendanceSource: 'Manual',
    scanTime: string,
  ): void {
    const currentGroup = this.group();
    if (!currentGroup) {
      return;
    }

    const updatedStudents = (currentGroup.students ?? []).map((student) =>
      student.id === studentId
        ? {
            ...student,
            lastAttendance: scanTime,
            attendanceTime: scanTime,
            attendanceState,
            attendanceSource,
          }
        : student,
    );

    this.group.set({ ...currentGroup, students: updatedStudents });
  }

  private filterSessionStudents(students: GroupStudent[]): GroupStudent[] {
    const query = this.studentSearch().trim().toLowerCase();
    const statusFilter = this.studentStatusFilter();

    return students.filter((student) => {
      const status = this.studentStatusLabel(student);
      const matchesQuery =
        !query ||
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        this.studentBarcodeLabel(student).toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'present' && status === 'Present') ||
        (statusFilter === 'absent' && status === 'Absent');

      return matchesQuery && matchesStatus;
    });
  }

  private filterCurriculumLessonOptions(lessons: CurriculumLessonOption[]): CurriculumLessonOption[] {
    const query = this.lessonPickerSearch().trim().toLowerCase();
    const statusFilter = this.lessonPickerStatusFilter();

    return lessons.filter((lesson) => {
      const isInserted = this.isCurriculumLessonInserted(lesson);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'available' && !isInserted) ||
        (statusFilter === 'inserted' && isInserted);
      const matchesQuery =
        !query ||
        lesson.title.toLowerCase().includes(query) ||
        lesson.path.toLowerCase().includes(query) ||
        Boolean(lesson.description?.toLowerCase().includes(query));

      return matchesStatus && matchesQuery;
    });
  }

  private isStudentStatusFilter(value: string): value is StudentStatusFilter {
    return value === 'all' || value === 'present' || value === 'absent';
  }

  private isLessonPickerStatusFilter(value: string): value is LessonPickerStatusFilter {
    return value === 'all' || value === 'available' || value === 'inserted';
  }

  private isExamAssignedToSession(exam: GroupExamRow, session: SessionDetailsRow | null): boolean {
    if (!session || session.kind !== 'dated' || !exam.date) {
      return false;
    }

    if (exam.date !== session.date) {
      return false;
    }

    const examTime = this.fullCalendarTime(exam.startTime ?? '');
    const sessionTime = this.fullCalendarTime(session.startTime);
    return !examTime || !sessionTime || examTime === sessionTime;
  }

  private mergePendingSessionHomeWork(exams: GroupExamRow[]): GroupExamRow[] {
    return this.withPendingSessionHomeWork(exams);
  }

  private withPendingSessionHomeWork(exams: GroupExamRow[]): GroupExamRow[] {
    const pending = this.readPendingSessionHomeWork();
    if (!pending) {
      return exams;
    }

    const hasSavedRow = exams.some((exam) => this.sameSessionHomeWorkAssignment(exam, pending));
    if (hasSavedRow) {
      this.clearPendingSessionHomeWork();
      return exams;
    }

    return [...exams, pending];
  }

  private readPendingSessionHomeWork(): PendingSessionHomeWorkRow | null {
    if (!this.groupId || !this.sessionId) {
      return null;
    }

    const exactPending = this.parsePendingSessionHomeWork(sessionStorage.getItem(this.pendingSessionHomeWorkStorageKey()));
    if (exactPending) {
      return exactPending;
    }

    const prefix = `tenant.session-homework.pending.${this.groupId}.`;
    const sessionDate = this.session()?.date;
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (!key?.startsWith(prefix)) {
        continue;
      }
      const pending = this.parsePendingSessionHomeWork(sessionStorage.getItem(key));
      if (pending && (!sessionDate || pending.date === sessionDate)) {
        return pending;
      }
    }
    return null;
  }

  private clearPendingSessionHomeWork(): void {
    if (!this.groupId || !this.sessionId) {
      return;
    }
    sessionStorage.removeItem(this.pendingSessionHomeWorkStorageKey());
  }

  private sameSessionHomeWorkAssignment(left: GroupExamRow, right: GroupExamRow): boolean {
    return left.examId === right.examId
      && left.date === right.date
      && this.fullCalendarTime(left.startTime ?? '') === this.fullCalendarTime(right.startTime ?? '');
  }

  private parsePendingSessionHomeWork(raw: string | null): PendingSessionHomeWorkRow | null {
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as PendingSessionHomeWorkRow;
      return parsed?.groupId === this.groupId && parsed?.examId && parsed?.date ? parsed : null;
    } catch {
      return null;
    }
  }

  private isPendingSessionExam(exam: GroupExamRow): boolean {
    return exam.id.startsWith('pending-');
  }

  private pendingSessionHomeWorkStorageKey(): string {
    return `tenant.session-homework.pending.${this.groupId}.${this.toStorageKeyPart(this.sessionId ?? '')}`;
  }

  private toStorageKeyPart(value: string): string {
    return value.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  }

  private buildSessionReportDocument(group: GroupDetails, session: SessionDetailsRow): { doc: JsPdfWithAutoTable; fileName: string } {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }) as JsPdfWithAutoTable;
    const students = this.sessionStudents();
    const present = students.filter((student) => this.studentStatusLabel(student) === 'Present').length;
    const absent = Math.max(0, students.length - present);
    const generatedAt = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    this.drawSessionReportHeader(doc, group, session, generatedAt);
    this.drawSessionReportSummary(doc, group, session, present, absent);
    this.drawSessionAttendanceChart(doc, present, absent, 210, 45, 55);
    this.drawSessionStudentTable(doc, group, session, students, 106);
    this.drawSessionReportFooter(doc);
    return { doc, fileName: this.sessionReportFileName(group, session) };
  }

  private drawSessionReportHeader(doc: jsPDF, group: GroupDetails, session: SessionDetailsRow, generatedAt: string): void {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 34, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('Session Report', 14, 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(`${group.name} | ${group.subject}`, 14, 25);
    doc.text(`Generated ${generatedAt}`, 283, 16, { align: 'right' });
    doc.text('AZ EduManage', 283, 25, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(this.sessionDateLabel(session), 14, 45);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text([
      `Time: ${this.sessionTimeWindowLabel(session)}`,
      `Teacher: ${this.sessionTeacherName()}`,
      `Room: ${session.room}`,
      `Status: ${this.sessionLiveStatusLabel(session)}`,
    ], 14, 52);
  }

  private drawSessionReportSummary(
    doc: jsPDF,
    group: GroupDetails,
    session: SessionDetailsRow,
    present: number,
    absent: number,
  ): void {
    const cards = [
      { label: 'Students', value: String(this.sessionStudents().length) },
      { label: 'Present', value: String(present) },
      { label: 'Absent', value: String(absent) },
      { label: 'Session', value: `#${this.sessionIndex(session)}` },
      { label: 'Fee', value: this.sessionPaymentLabel(group) },
    ];

    cards.forEach((card, index) => {
      const x = 14 + index * 37;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, 76, 33, 19, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(card.label, x + 3, 83);
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(card.value, x + 3, 91, { maxWidth: 27 });
    });
  }

  private drawSessionAttendanceChart(doc: jsPDF, present: number, absent: number, x: number, y: number, width: number): void {
    const total = Math.max(1, present + absent);
    const presentWidth = (present / total) * width;
    const absentWidth = (absent / total) * width;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Attendance Distribution', x, y);
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y + 7, width + 12, 43, 2, 2, 'FD');

    doc.setFillColor(16, 185, 129);
    doc.roundedRect(x + 6, y + 18, Math.max(3, presentWidth), 7, 1, 1, 'F');
    doc.setFillColor(244, 63, 94);
    doc.roundedRect(x + 6, y + 31, Math.max(3, absentWidth), 7, 1, 1, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Present ${present}`, x + 6, y + 15);
    doc.text(`Absent ${absent}`, x + 6, y + 28);
    doc.text(`${Math.round((present / total) * 100)}% present`, x + width + 8, y + 15, { align: 'right' });
    doc.text(`${Math.round((absent / total) * 100)}% absent`, x + width + 8, y + 28, { align: 'right' });
  }

  private drawSessionStudentTable(
    doc: JsPdfWithAutoTable,
    group: GroupDetails,
    session: SessionDetailsRow,
    students: GroupStudent[],
    startY: number,
  ): void {
    const body: RowInput[] = students.map((student, index) => [
      String(index + 1),
      student.name,
      student.parentName?.trim() || 'Not set',
      this.studentStatusLabel(student),
      this.studentAttendanceTimeLabel(student),
      this.sessionPaymentLabel(group),
      this.studentAssessmentNoteLabel(student, session),
    ]);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Student Details', 14, startY - 7);

    autoTable(doc, {
      startY,
      head: [['#', 'Student', 'Parent', 'Attendance', 'Arrival time', 'Payment', 'Assessment notes']],
      body: body.length ? body : [['', 'No students enrolled', '', '', '', '', '']],
      theme: 'grid',
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 8,
        cellPadding: 2.4,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 42 },
        2: { cellWidth: 38 },
        3: { cellWidth: 26 },
        4: { cellWidth: 28 },
        5: { cellWidth: 32 },
        6: { cellWidth: 'auto' },
      },
      didParseCell: (data) => {
        if (data.section !== 'body' || data.column.index !== 3) {
          return;
        }
        const value = String(data.cell.raw ?? '');
        if (value === 'Present') {
          data.cell.styles.textColor = [22, 101, 52];
          data.cell.styles.fontStyle = 'bold';
        } else if (value === 'Absent') {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
  }

  private drawSessionReportFooter(doc: jsPDF): void {
    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 194, 283, 194);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Formal session report, attendance and administrative summary', 14, 200);
      doc.text(`Page ${page} of ${totalPages}`, 283, 200, { align: 'right' });
    }
  }

  private sessionReportFileName(group: GroupDetails, session: SessionDetailsRow): string {
    const groupName = group.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'group';
    const date = session.date && session.date !== 'Recurring' ? session.date : 'session';
    const [hour = '00', minute = '00'] = (this.fullCalendarTime(session.startTime) ?? session.startTime).split(':');
    const time = `${hour}${minute}`.replace(/\D/g, '') || 'time';
    return `${groupName}-${date}-${time}-session-report.pdf`;
  }

  private sessionPaymentLabel(group: GroupDetails): string {
    const amount = group.fees ?? group.pricePerStudent;
    if (!Number.isFinite(amount) || amount <= 0) {
      return 'Not recorded';
    }
    return `${amount} ${group.currency || 'EGP'}`;
  }

  private studentAssessmentNoteLabel(_student: GroupStudent, _session: SessionDetailsRow): string {
    return 'Not recorded';
  }

  private normalizeBarcodeValue(value: string | null | undefined): string {
    return value?.trim().toLowerCase() ?? '';
  }

  private extractAttendanceTime(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    if (!trimmed) {
      return null;
    }

    const timeMatch = trimmed.match(/(?:T|\s|^)(\d{1,2}:\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/);
    return timeMatch?.[1] ?? null;
  }

  private studentAttendanceInSessionWindow(student: GroupStudent, session: SessionDetailsRow): boolean {
    const window = this.sessionWindow(session);
    const recordedAt = this.attendanceDateTime(student.attendanceTime ?? student.lastAttendance, session);
    if (!window || !recordedAt) {
      return false;
    }
    return recordedAt >= window.start && recordedAt < window.end;
  }

  private attendanceDateTime(value: string | null | undefined, session: SessionDetailsRow): Date | null {
    const trimmed = value?.trim();
    if (!trimmed) {
      return null;
    }

    const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
    const direct = new Date(normalized);
    if (!Number.isNaN(direct.getTime())) {
      return direct;
    }

    const time = this.extractAttendanceTime(trimmed);
    const date = session.date && session.date !== 'Scheduled' && session.date !== 'Recurring' ? session.date : null;
    if (!time || !date) {
      return null;
    }
    const withSessionDate = new Date(`${date}T${this.fullCalendarTime(time) ?? time}`);
    return Number.isNaN(withSessionDate.getTime()) ? null : withSessionDate;
  }

  private focusBarcodeInput(): void {
    setTimeout(() => this.sessionBarcodeInput?.nativeElement.focus(), 0);
  }

  private buildSessionRows(group: GroupDetails | null): SessionDetailsRow[] {
    if (!group) {
      return [];
    }

    if (group.calendarEvents?.length) {
      return group.calendarEvents.map((event) => ({
        id: event.id,
        day: event.day || this.weekdayLabel(event.date),
        date: event.date || 'Scheduled',
        startTime: event.startTime,
        endTime: event.endTime,
        timeRange: this.timeRange(event.startTime, event.endTime),
        room: event.room || group.room || 'No room',
        kind: 'dated',
      }));
    }

    const daySchedules = Object.entries(group.daySchedules ?? {});
    if (daySchedules.length) {
      return daySchedules.map(([day, schedule]) => ({
        id: `schedule-${day}`,
        day,
        date: 'Recurring',
        startTime: schedule.startTime ?? '',
        endTime: schedule.endTime ?? '',
        timeRange: this.timeRange(schedule.startTime ?? '', schedule.endTime ?? ''),
        room: schedule.room || group.room || 'No room',
        kind: 'recurring',
      }));
    }

    const startAt = group.startAt ?? '';
    const endAt = group.duration && group.duration > 0 ? this.addMinutes(startAt, group.duration) : '';
    return (group.scheduleDays ?? []).map((day) => ({
      id: `schedule-${day}`,
      day,
      date: 'Recurring',
      startTime: startAt,
      endTime: endAt,
      timeRange: this.timeRange(startAt, endAt),
      room: group.room || 'No room',
      kind: 'recurring',
    }));
  }

  private sessionDate(session: SessionDetailsRow): Date | null {
    if (!session.date || session.date === 'Scheduled' || session.date === 'Recurring') {
      return null;
    }

    const date = new Date(`${session.date}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private sessionDateTime(session: SessionDetailsRow, time: string): Date | null {
    const date = this.sessionDate(session);
    const normalized = this.fullCalendarTime(time);
    if (!date || !normalized) {
      return null;
    }

    const value = new Date(`${session.date}T${normalized}`);
    return Number.isNaN(value.getTime()) ? null : value;
  }

  private minutesFromTime(time: string): number | null {
    const normalized = this.fullCalendarTime(time);
    if (!normalized) {
      return null;
    }

    const [hour, minute] = normalized.split(':').map(Number);
    return hour * 60 + minute;
  }

  private timeRange(start: string, end: string): string {
    const startTime = this.displayMeridiemTime(start);
    const endTime = this.displayMeridiemTime(end);
    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    }
    return startTime || endTime || 'Time not set';
  }

  private displayMeridiemTime(time: string): string {
    const normalized = this.fullCalendarTime(time);
    if (!normalized) {
      return '';
    }

    const [hourValue, minuteValue] = normalized.split(':').map(Number);
    const period = hourValue >= 12 ? 'PM' : 'AM';
    const hour = hourValue % 12 || 12;
    return `${hour}:${String(minuteValue).padStart(2, '0')} ${period}`;
  }

  private sessionLiveStatus(session: SessionDetailsRow): SessionLiveStatus {
    const window = this.sessionWindow(session);
    if (!window) {
      return 'coming';
    }

    const now = this.currentTime();
    if (now < window.start) {
      return 'coming';
    }
    if (now >= window.end) {
      return 'ended';
    }
    return 'running';
  }

  private sessionWindow(session: SessionDetailsRow): { start: Date; end: Date } | null {
    const start = this.sessionDateTime(session, session.startTime);
    const end = this.sessionDateTime(session, session.endTime);
    if (!start || !end) {
      return null;
    }

    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }

    return { start, end };
  }

  private durationClockLabel(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
  }

  private weekdayLabel(date: string): string {
    const value = new Date(`${date}T00:00:00`);
    return Number.isNaN(value.getTime()) ? 'Scheduled' : value.toLocaleDateString('en-US', { weekday: 'long' });
  }

  private addMinutes(time: string, minutes: number): string {
    const [hourPart, minutePart = '0'] = time.split(':');
    const hour = Number(hourPart);
    const minute = Number(minutePart);
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return '';
    }
    const total = hour * 60 + minute + minutes;
    const nextHour = Math.floor(total / 60) % 24;
    const nextMinute = total % 60;
    return `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`;
  }

  private fullCalendarTime(time: string): string | null {
    const trimmed = time.trim();
    if (!trimmed) {
      return null;
    }
    const [hourPart, minutePart = '0'] = trimmed.split(':');
    const hour = Number(hourPart);
    const minute = Number(minutePart);
    if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  }

  private findNodePath(
    nodes: TenantSubjectCurriculumNode[],
    nodeId: string,
    parents: TenantSubjectCurriculumNode[] = [],
  ): TenantSubjectCurriculumNode[] {
    for (const node of nodes) {
      const path = [...parents, node];
      if (node.id === nodeId) {
        return path;
      }
      const childPath = this.findNodePath(node.children ?? [], nodeId, path);
      if (childPath.length) {
        return childPath;
      }
    }
    return [];
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private flattenCurriculumLessons(root: TenantSubjectCurriculumNode): CurriculumLessonOption[] {
    const lessons: CurriculumLessonOption[] = [];
    const visit = (node: TenantSubjectCurriculumNode, path: string[]): void => {
      const nextPath = node.id === 'curriculum' ? path : [...path, node.label];
      if (node.id !== 'curriculum' && !node.children.length && this.isUuid(node.id)) {
        lessons.push({
          id: node.id,
          title: node.label,
          path: nextPath.slice(0, -1).join(' / ') || root.label,
          description: node.description ?? null,
        });
      }
      for (const child of node.children ?? []) {
        visit(child, nextPath);
      }
    };
    visit(root, []);
    return lessons;
  }

  private mergeGroupLessons(current: GroupLesson[], incoming: GroupLesson[]): GroupLesson[] {
    const merged = new Map<string, GroupLesson>();
    for (const lesson of current) {
      merged.set(lesson.curriculumNodeId, lesson);
    }
    for (const lesson of incoming) {
      merged.set(lesson.curriculumNodeId, lesson);
    }
    return Array.from(merged.values());
  }

  private parseNoteContent(contentJson: string | null | undefined): LessonNoteContent {
    if (!contentJson) {
      return {};
    }
    try {
      const parsed = JSON.parse(contentJson) as LessonNoteContent;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private noteBlockLines(block: LessonNoteBlock): string[] {
    const data = block.data ?? {};
    if (Array.isArray(data.items)) {
      return data.items;
    }
    return [data.text, data.caption].filter((line): line is string => Boolean(line));
  }

  private stripHtml(value: string): string {
    return value.replace(/<[^>]*>/g, ' ');
  }

  private clearPreviewObjectUrl(): void {
    const objectUrl = this.previewObjectUrl();
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    this.previewObjectUrl.set(null);
    this.previewSafeObjectUrl.set(null);
  }

  private clearReportPreviewObjectUrl(): void {
    const objectUrl = this.reportPreviewObjectUrl();
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    this.reportPreviewObjectUrl.set(null);
    this.reportPreviewSafeObjectUrl.set(null);
  }
}
