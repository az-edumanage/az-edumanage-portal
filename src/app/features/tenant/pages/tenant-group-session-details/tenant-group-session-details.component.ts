import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { TenantGroupAttendanceDataService } from '../../data-access/tenant-group-attendance-data.service';
import { GroupDetails, GroupLesson, GroupLessonContent, GroupStudent } from '../../models/tenant-group-details.models';
import { TenantBarcodeAttendanceScanResponse } from '../../models/tenant-group-attendance.models';
import { TenantGroupDetailsDataService } from '../../data-access/tenant-group-details-data.service';
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

@Component({
  selector: 'app-tenant-group-session-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-group-session-details.component.html',
  styleUrl: './tenant-group-session-details.component.css',
})
export class TenantGroupSessionDetailsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly data = inject(TenantGroupDetailsDataService);
  private readonly attendanceData = inject(TenantGroupAttendanceDataService);
  private readonly subjectsData = inject(TenantSubjectsDataService);
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);

  @ViewChild('sessionBarcodeInput') private sessionBarcodeInput?: ElementRef<HTMLInputElement>;

  readonly groupId = this.route.snapshot.paramMap.get('id');
  readonly sessionId = this.route.snapshot.paramMap.get('sessionId');
  readonly group = signal<GroupDetails | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly lessons = signal<GroupLesson[]>([]);
  readonly lessonsLoading = signal(false);
  readonly lessonsError = signal<string | null>(null);
  readonly studentSearch = signal('');
  readonly studentStatusFilter = signal<StudentStatusFilter>('all');
  readonly studentPageIndex = signal(0);
  readonly studentPageSize = signal(5);
  readonly lessonPageIndex = signal(0);
  readonly lessonPageSize = signal(5);
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
  readonly savingLessonNodeId = signal<string | null>(null);
  readonly removingLessonId = signal<string | null>(null);
  readonly updatingLessonCompletionId = signal<string | null>(null);
  readonly previewContent = signal<GroupLessonContent | null>(null);
  readonly previewNote = signal<TenantCurriculumMaterialNote | null>(null);
  readonly previewLoading = signal(false);
  readonly previewError = signal<string | null>(null);
  readonly previewObjectUrl = signal<string | null>(null);
  readonly previewSafeObjectUrl = signal<SafeResourceUrl | null>(null);
  readonly barcodeInputValue = signal('');
  readonly barcodeScanInProgress = signal(false);
  readonly barcodeScanNotification = signal<{ message: string; state: 'success' | 'error' } | null>(null);
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
  readonly curriculumLessonOptions = computed<CurriculumLessonOption[]>(() => {
    const root = this.lessonCurriculumRoot();
    return root ? this.flattenCurriculumLessons(root) : [];
  });
  readonly filteredCurriculumLessonOptions = computed<CurriculumLessonOption[]>(() =>
    this.filterCurriculumLessonOptions(this.curriculumLessonOptions()),
  );
  private readonly groupRefreshIntervalMs = 5000;
  private clockIntervalId: ReturnType<typeof setInterval> | null = null;
  private groupRefreshIntervalId: ReturnType<typeof setInterval> | null = null;
  private refreshingGroup = false;

  ngOnInit(): void {
    this.clockIntervalId = setInterval(() => this.currentTime.set(new Date()), 1000);
    this.groupRefreshIntervalId = setInterval(() => void this.refreshGroup(), this.groupRefreshIntervalMs);
    void this.loadGroup();
    void this.loadLessons();
  }

  ngOnDestroy(): void {
    if (this.clockIntervalId) {
      clearInterval(this.clockIntervalId);
    }
    if (this.groupRefreshIntervalId) {
      clearInterval(this.groupRefreshIntervalId);
    }
    this.clearPreviewObjectUrl();
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
    const elapsed = Math.min(Math.max(0, now - window.start.getTime()), window.end.getTime() - window.start.getTime());
    return this.durationClockLabel(elapsed);
  }

  sessionCapacityLabel(group: GroupDetails | null): string {
    if (!group) {
      return '0 / 0';
    }
    return `${group.enrolled} / ${group.capacity}`;
  }

  studentStatusLabel(student: GroupStudent): string {
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

    return this.extractAttendanceTime(student.lastAttendance) ?? 'Not recorded';
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
      this.lessonsError.set(error instanceof Error ? error.message : 'Unable to remove lesson');
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

  materialIcon(content: GroupLessonContent): string {
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

  canPreviewContent(content: GroupLessonContent): boolean {
    return Boolean(content.url && (this.isImageContent(content) || this.isVideoContent(content) || this.isPdfContent(content)));
  }

  isImageContent(content: GroupLessonContent): boolean {
    const type = content.fileContentType?.toLowerCase() ?? '';
    const title = content.title.toLowerCase();
    return type.startsWith('image/') || /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(title);
  }

  isVideoContent(content: GroupLessonContent): boolean {
    const type = content.fileContentType?.toLowerCase() ?? '';
    const title = content.title.toLowerCase();
    return type.startsWith('video/') || /\.(m4v|mov|mp4|mpeg|mpg|ogg|ogv|webm)$/i.test(title);
  }

  isPdfContent(content: GroupLessonContent): boolean {
    const type = content.fileContentType?.toLowerCase() ?? '';
    return type.includes('pdf') || content.title.toLowerCase().endsWith('.pdf');
  }

  safeContentUrl(content: GroupLessonContent): SafeResourceUrl {
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
      this.group.set(await firstValueFrom(this.data.loadGroupById(this.groupId)));
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
      this.group.set(await firstValueFrom(this.data.loadGroupById(this.groupId)));
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
      this.lessons.set(await firstValueFrom(this.data.loadGroupLessons(this.groupId, { sync: false, sessionId: this.sessionId })));
    } catch (error) {
      this.lessonsError.set(error instanceof Error ? error.message : 'Unable to load lessons');
    } finally {
      this.lessonsLoading.set(false);
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
        firstValueFrom(this.data.loadGroupLessonContent(this.groupId, lesson.id)),
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
      id: `material-${option.type}-${option.id}`,
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
    for (const content of primary) {
      merged.set(this.contentKey(content), content);
    }
    for (const content of material) {
      merged.set(this.contentKey(content), content);
    }
    return Array.from(merged.values());
  }

  private contentKey(content: Pick<GroupLessonContent, 'contentType' | 'contentId'>): string {
    return `${content.contentType}:${content.contentId}`;
  }

  private async loadPreviewNote(content: GroupLessonContent): Promise<void> {
    const group = this.group();
    if (!group?.subjectId) {
      this.previewError.set('Unable to load this note because the group has no linked subject.');
      return;
    }

    this.previewLoading.set(true);
    try {
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

  private async loadPreviewFile(content: GroupLessonContent): Promise<void> {
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
    const [hourPart, minutePart = '0'] = time.trim().split(':');
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
}
