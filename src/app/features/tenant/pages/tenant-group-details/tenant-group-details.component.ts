import { Component, computed, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { I18nService } from '../../../../core/services/i18n.service';
import { GroupDetails, GroupLesson, GroupStudent } from '../../models/tenant-group-details.models';
import { TenantSubjectCurriculumNode } from '../../models/tenant-subjects.models';
import { TenantGroupDetailsDataService } from '../../data-access/tenant-group-details-data.service';
import { TenantGroupDetailsFacade } from '../../state/tenant-group-details.facade';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';

type GroupDetailsTab = 'sessions' | 'enrolledStudents' | 'lessons' | 'overview';
type SessionFilter = 'all' | 'dated' | 'recurring';
type SessionRelativeStatus = 'current' | 'next';
type LessonFilter = 'all' | 'withDescription' | 'withoutDescription';
type EnrolledStudentFilter = 'all' | 'present' | 'absent' | 'notMarked';

interface GroupSessionRow {
  id: string;
  day: string;
  date: string;
  timeRange: string;
  room: string;
  kind: Exclude<SessionFilter, 'all'>;
  timelineStartMs: number | null;
  timelineEndMs: number | null;
}

interface CurriculumLessonOption {
  id: string;
  title: string;
  path: string;
  description: string | null;
}

@Component({
  selector: 'app-tenant-group-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, MatIconModule, FullCalendarModule],
  templateUrl: './tenant-group-details.component.html',
  styleUrl: './tenant-group-details.component.css'})
export class TenantGroupDetailsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly facade = inject(TenantGroupDetailsFacade);
  private readonly groupDetailsData = inject(TenantGroupDetailsDataService);
  private readonly subjectsData = inject(TenantSubjectsDataService);
  private readonly i18n = inject(I18nService);

  readonly group = this.facade.group;
  readonly selectedStudent = this.facade.selectedStudent;
  readonly students = this.facade.students;
  readonly isLoading = this.facade.isLoading;
  readonly error = this.facade.error;
  readonly exitStudentError = this.facade.exitStudentError;
  readonly exitingStudentId = this.facade.exitingStudentId;
  readonly avgAttendanceLabel = this.facade.avgAttendanceLabel;
  readonly absenceRateLabel = this.facade.absenceRateLabel;
  readonly monthlyRevenueLabel = this.facade.monthlyRevenueLabel;
  readonly capacityUsageLabel = this.facade.capacityUsageLabel;
  readonly groupId = this.route.snapshot.paramMap.get('id');
  readonly calendarOpen = signal(false);
  readonly eventEditorOpen = signal(false);
  readonly eventFormError = signal<string | null>(null);
  readonly customCalendarEvents = signal<EventInput[]>([]);
  readonly activeTab = signal<GroupDetailsTab>('sessions');
  readonly sessionSearchTerm = signal('');
  readonly sessionFilter = signal<SessionFilter>('all');
  readonly sessionFilterPanelOpen = signal(false);
  readonly sessionPageIndex = signal(0);
  readonly sessionPageSize = signal(5);
  readonly lessonPickerOpen = signal(false);
  readonly lessonPickerLoading = signal(false);
  readonly lessonPickerError = signal<string | null>(null);
  readonly lessonCurriculumRoot = signal<TenantSubjectCurriculumNode | null>(null);
  readonly lessonsLoading = signal(false);
  readonly lessonsLoaded = signal(false);
  readonly lessonsSyncing = signal(false);
  readonly lessonsSynced = signal(false);
  readonly lessonsError = signal<string | null>(null);
  readonly savingLessonNodeId = signal<string | null>(null);
  readonly groupLessons = signal<GroupLesson[]>([]);
  readonly lessonSearchTerm = signal('');
  readonly lessonFilter = signal<LessonFilter>('all');
  readonly lessonPageIndex = signal(0);
  readonly lessonPageSize = signal(5);
  readonly enrolledStudentSearchTerm = signal('');
  readonly enrolledStudentFilter = signal<EnrolledStudentFilter>('all');
  readonly enrolledStudentPageIndex = signal(0);
  readonly enrolledStudentPageSize = signal(5);
  readonly sessionRows = computed<GroupSessionRow[]>(() => this.buildSessionRows());
  readonly curriculumLessonOptions = computed<CurriculumLessonOption[]>(() => {
    const root = this.lessonCurriculumRoot();
    return root ? this.flattenCurriculumLessons(root) : [];
  });
  readonly availableCurriculumLessonOptions = computed(() => {
    const addedLessonIds = new Set(this.groupLessons().map((lesson) => lesson.curriculumNodeId));
    return this.curriculumLessonOptions().filter((lesson) => !addedLessonIds.has(lesson.id));
  });
  readonly filteredSessionRows = computed<GroupSessionRow[]>(() => {
    const query = this.sessionSearchTerm().trim().toLowerCase();
    const filter = this.sessionFilter();
    return this.sessionRows().filter((session) => {
      const matchesFilter = filter === 'all' || session.kind === filter;
      const matchesSearch =
        !query ||
        [session.day, session.date, session.timeRange, session.room].some((value) => value.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  });
  readonly sessionTotalPages = computed(() => Math.max(1, Math.ceil(this.filteredSessionRows().length / this.sessionPageSize())));
  readonly pagedSessionRows = computed(() => {
    const pageIndex = Math.min(this.sessionPageIndex(), this.sessionTotalPages() - 1);
    const start = pageIndex * this.sessionPageSize();
    return this.filteredSessionRows().slice(start, start + this.sessionPageSize());
  });
  readonly filteredGroupLessons = computed(() => {
    const query = this.lessonSearchTerm().trim().toLowerCase();
    const filter = this.lessonFilter();
    return this.groupLessons().filter((lesson) => {
      const hasDescription = Boolean(lesson.description?.trim());
      const matchesFilter =
        filter === 'all' ||
        (filter === 'withDescription' && hasDescription) ||
        (filter === 'withoutDescription' && !hasDescription);
      const matchesSearch =
        !query ||
        [lesson.title, lesson.path, lesson.description ?? ''].some((value) => value.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  });
  readonly lessonTotalPages = computed(() => Math.max(1, Math.ceil(this.filteredGroupLessons().length / this.lessonPageSize())));
  readonly pagedGroupLessons = computed(() => {
    const pageIndex = this.lessonVisiblePageIndex();
    const start = pageIndex * this.lessonPageSize();
    return this.filteredGroupLessons().slice(start, start + this.lessonPageSize());
  });
  readonly filteredEnrolledStudents = computed(() => {
    const query = this.enrolledStudentSearchTerm().trim().toLowerCase();
    const filter = this.enrolledStudentFilter();
    return this.students().filter((student) => {
      const attendanceState = student.attendanceState ?? null;
      const matchesFilter =
        filter === 'all' ||
        (filter === 'present' && attendanceState === 'Present') ||
        (filter === 'absent' && attendanceState === 'Absent') ||
        (filter === 'notMarked' && attendanceState === null);
      const matchesSearch =
        !query ||
        [
          student.name,
          student.email,
          student.barcodeNumber ?? '',
          student.lastAttendance,
          String(student.attendanceRate),
        ].some((value) => value.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  });
  readonly enrolledStudentTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredEnrolledStudents().length / this.enrolledStudentPageSize())),
  );
  readonly pagedEnrolledStudents = computed(() => {
    const pageIndex = this.enrolledStudentVisiblePageIndex();
    const start = pageIndex * this.enrolledStudentPageSize();
    return this.filteredEnrolledStudents().slice(start, start + this.enrolledStudentPageSize());
  });
  readonly sessionRelativeStatusById = computed(() => {
    const now = Date.now();
    const upcomingRows = this.sessionRows()
      .filter((session) => session.timelineStartMs !== null && (session.timelineEndMs === null || session.timelineEndMs > now))
      .sort((first, second) => (first.timelineStartMs ?? 0) - (second.timelineStartMs ?? 0));
    const statuses = new Map<string, SessionRelativeStatus>();
    if (upcomingRows[0]) {
      statuses.set(upcomingRows[0].id, 'current');
    }
    if (upcomingRows[1]) {
      statuses.set(upcomingRows[1].id, 'next');
    }
    return statuses;
  });
  readonly eventForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    date: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
  });
  readonly calendarOptions = computed<CalendarOptions>(() => ({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    buttonText: {
      today: 'Today',
      month: 'Month',
      week: 'Week',
      day: 'Day',
    },
    allDaySlot: false,
    selectable: true,
    selectMirror: true,
    nowIndicator: true,
    expandRows: true,
    height: 'auto',
    slotMinTime: '06:00:00',
    slotMaxTime: '23:00:00',
    select: (selection) => this.openEventEditorFromSelection(selection),
    dateClick: (selection) => this.openEventEditor(selection.date, this.addDateMinutes(selection.date, 60)),
    events: [...this.calendarEvents(), ...this.customCalendarEvents()],
  }));

  constructor() {
    effect(() => {
      if (this.activeTab() !== 'sessions') {
        return;
      }

      const currentSessionPageIndex = this.currentSessionPageIndex();
      if (currentSessionPageIndex === null) {
        return;
      }

      const visiblePageIndex = untracked(() => this.sessionPageIndex());
      if (visiblePageIndex !== currentSessionPageIndex) {
        this.sessionPageIndex.set(currentSessionPageIndex);
      }
    });

    effect(() => {
      const group = this.group();
      if (this.activeTab() !== 'lessons' || !this.isCurrentGroupReady(group)) {
        return;
      }
      const syncing = untracked(() => this.lessonsSyncing());
      const synced = untracked(() => this.lessonsSynced());
      if (!syncing && !synced) {
        void this.loadAndSyncGroupLessons();
      }
    });
  }

  ngOnInit(): void {
    this.facade.loadGroup(this.groupId);
    const requestedTab = this.route.snapshot.queryParamMap.get('tab');
    if (this.isGroupDetailsTab(requestedTab)) {
      this.selectTab(requestedTab);
    }
  }

  selectStudent(student: GroupStudent): void {
    this.facade.selectStudent(student);
  }

  activateStudentSelection(event: KeyboardEvent, student: GroupStudent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    this.selectStudent(student);
  }

  clearSelectedStudent(): void {
    this.facade.clearSelectedStudent();
  }

  selectTab(tab: GroupDetailsTab): void {
    this.activeTab.set(tab);
    if (tab === 'lessons') {
      void this.loadAndSyncGroupLessons();
    }
  }

  async loadGroupLessons(): Promise<void> {
    if (this.lessonsLoading() || this.lessonsLoaded()) {
      return;
    }
    this.lessonsLoading.set(true);
    this.lessonsError.set(null);
    try {
      this.groupLessons.set(await firstValueFrom(this.groupDetailsData.loadGroupLessons(this.groupId)));
      this.lessonsLoaded.set(true);
    } catch (error) {
      this.lessonsError.set(error instanceof Error ? error.message : 'Unable to load lessons');
    } finally {
      this.lessonsLoading.set(false);
    }
  }

  async loadAndSyncGroupLessons(): Promise<void> {
    await this.loadGroupLessons();
    await this.syncGroupLessonsFromCurriculum();
  }

  private async syncGroupLessonsFromCurriculum(): Promise<void> {
    const group = this.group();
    if (!this.isCurrentGroupReady(group) || this.lessonsSyncing() || this.lessonsSynced()) {
      return;
    }

    this.lessonsSyncing.set(true);
    this.lessonsError.set(null);
    try {
      const root = this.lessonCurriculumRoot()
        ?? await this.subjectsData.getSubjectCurriculumForCategory(group.subjectId, group.educationCategory);
      this.lessonCurriculumRoot.set(root);
      const existingNodeIds = new Set(this.groupLessons().map((lesson) => lesson.curriculumNodeId));
      const missingLessons = this.flattenCurriculumLessons(root).filter((lesson) => !existingNodeIds.has(lesson.id));
      if (!missingLessons.length) {
        this.lessonsSynced.set(true);
        return;
      }
      const savedLessons = await Promise.all(
        missingLessons.map((lesson) => firstValueFrom(this.groupDetailsData.addGroupLesson(this.groupId, lesson.id))),
      );
      this.groupLessons.update((lessons) => this.mergeGroupLessons(lessons, savedLessons));
      this.lessonsSynced.set(true);
    } catch (error) {
      this.lessonsError.set(error instanceof Error ? error.message : 'Unable to load lessons from curriculum');
    } finally {
      this.lessonsSyncing.set(false);
    }
  }

  private isCurrentGroupReady(group: GroupDetails | null): group is GroupDetails & { subjectId: string } {
    return Boolean(group?.id === this.groupId && group.subjectId);
  }

  async openLessonPicker(): Promise<void> {
    await this.loadGroupLessons();
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
      this.lessonPickerError.set(this.subjectsData.toUserMessage(error, 'Unable to load curriculum. Please try again.'));
    } finally {
      this.lessonPickerLoading.set(false);
    }
  }

  closeLessonPicker(): void {
    this.lessonPickerOpen.set(false);
    this.lessonPickerError.set(null);
  }

  async addLessonFromCurriculum(lesson: CurriculumLessonOption): Promise<void> {
    if (this.groupLessons().some((currentLesson) => currentLesson.curriculumNodeId === lesson.id) || this.savingLessonNodeId()) {
      return;
    }
    this.savingLessonNodeId.set(lesson.id);
    this.lessonPickerError.set(null);
    try {
      const savedLesson = await firstValueFrom(this.groupDetailsData.addGroupLesson(this.groupId, lesson.id));
      this.groupLessons.update((lessons) => [...lessons, savedLesson]);
      this.lessonPickerOpen.set(false);
    } catch (error) {
      this.lessonPickerError.set(error instanceof Error ? error.message : 'Unable to add lesson');
    } finally {
      this.savingLessonNodeId.set(null);
    }
  }

  setLessonSearchTerm(value: string): void {
    this.lessonSearchTerm.set(value);
    this.lessonPageIndex.set(0);
  }

  setLessonFilter(value: string): void {
    this.lessonFilter.set(this.isLessonFilter(value) ? value : 'all');
    this.lessonPageIndex.set(0);
  }

  setLessonPageSize(value: string | number): void {
    const size = Number(value);
    this.lessonPageSize.set(Number.isFinite(size) && size > 0 ? size : 5);
    this.lessonPageIndex.set(0);
  }

  previousLessonPage(): void {
    this.lessonPageIndex.update((page) => Math.max(0, page - 1));
  }

  nextLessonPage(): void {
    this.lessonPageIndex.update((page) => Math.min(this.lessonTotalPages() - 1, page + 1));
  }

  lessonPageStart(): number {
    const total = this.filteredGroupLessons().length;
    return total === 0 ? 0 : this.lessonVisiblePageIndex() * this.lessonPageSize() + 1;
  }

  lessonPageEnd(): number {
    return Math.min(this.filteredGroupLessons().length, this.lessonPageStart() + this.pagedGroupLessons().length - 1);
  }

  lessonVisiblePageIndex(): number {
    return Math.min(this.lessonPageIndex(), this.lessonTotalPages() - 1);
  }

  activeLessonFiltersCount(): number {
    return (this.lessonSearchTerm().trim() ? 1 : 0) + (this.lessonFilter() === 'all' ? 0 : 1);
  }

  clearLessonFilters(): void {
    this.lessonSearchTerm.set('');
    this.lessonFilter.set('all');
    this.lessonPageIndex.set(0);
  }

  setEnrolledStudentSearchTerm(value: string): void {
    this.enrolledStudentSearchTerm.set(value);
    this.enrolledStudentPageIndex.set(0);
  }

  setEnrolledStudentFilter(value: string): void {
    this.enrolledStudentFilter.set(this.isEnrolledStudentFilter(value) ? value : 'all');
    this.enrolledStudentPageIndex.set(0);
  }

  setEnrolledStudentPageSize(value: string | number): void {
    const size = Number(value);
    this.enrolledStudentPageSize.set(Number.isFinite(size) && size > 0 ? size : 5);
    this.enrolledStudentPageIndex.set(0);
  }

  previousEnrolledStudentPage(): void {
    this.enrolledStudentPageIndex.update((page) => Math.max(0, page - 1));
  }

  nextEnrolledStudentPage(): void {
    this.enrolledStudentPageIndex.update((page) => Math.min(this.enrolledStudentTotalPages() - 1, page + 1));
  }

  enrolledStudentPageStart(): number {
    const total = this.filteredEnrolledStudents().length;
    return total === 0 ? 0 : this.enrolledStudentVisiblePageIndex() * this.enrolledStudentPageSize() + 1;
  }

  enrolledStudentPageEnd(): number {
    return Math.min(
      this.filteredEnrolledStudents().length,
      this.enrolledStudentPageStart() + this.pagedEnrolledStudents().length - 1,
    );
  }

  enrolledStudentVisiblePageIndex(): number {
    return Math.min(this.enrolledStudentPageIndex(), this.enrolledStudentTotalPages() - 1);
  }

  activeEnrolledStudentFiltersCount(): number {
    return (this.enrolledStudentSearchTerm().trim() ? 1 : 0) + (this.enrolledStudentFilter() === 'all' ? 0 : 1);
  }

  clearEnrolledStudentFilters(): void {
    this.enrolledStudentSearchTerm.set('');
    this.enrolledStudentFilter.set('all');
    this.enrolledStudentPageIndex.set(0);
  }

  attendanceStateLabel(student: GroupStudent): string {
    return student.attendanceState ?? 'Not marked';
  }

  setSessionSearchTerm(value: string): void {
    this.sessionSearchTerm.set(value);
    this.sessionPageIndex.set(0);
  }

  setSessionFilter(value: string): void {
    this.sessionFilter.set(value as SessionFilter);
    this.sessionPageIndex.set(0);
  }

  toggleSessionFilterPanel(): void {
    this.sessionFilterPanelOpen.update((open) => !open);
  }

  clearSessionAdvancedFilters(): void {
    this.sessionFilter.set('all');
    this.sessionPageIndex.set(0);
  }

  previousSessionPage(): void {
    this.sessionPageIndex.update((page) => Math.max(0, page - 1));
  }

  nextSessionPage(): void {
    this.sessionPageIndex.update((page) => Math.min(this.sessionTotalPages() - 1, page + 1));
  }

  openSessionDetails(session: GroupSessionRow): void {
    if (!this.groupId) {
      return;
    }
    void this.router.navigate(['/tenant/groups', this.groupId, 'sessions', session.id]);
  }

  activateSessionDetails(event: KeyboardEvent, session: GroupSessionRow): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    this.openSessionDetails(session);
  }

  openLessonDetails(lesson: GroupLesson): void {
    if (!this.groupId) {
      return;
    }
    void this.router.navigate(['/tenant/groups', this.groupId, 'lessons', lesson.id]);
  }

  activateLessonDetails(event: KeyboardEvent, lesson: GroupLesson): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    this.openLessonDetails(lesson);
  }

  setSessionPageSize(value: string): void {
    this.sessionPageSize.set(Number(value));
    this.sessionPageIndex.set(0);
  }

  sessionPageStart(): number {
    const total = this.filteredSessionRows().length;
    return total === 0 ? 0 : this.sessionPageIndex() * this.sessionPageSize() + 1;
  }

  sessionPageEnd(): number {
    return Math.min(this.filteredSessionRows().length, this.sessionPageStart() + this.pagedSessionRows().length - 1);
  }

  activeSessionFiltersCount(): number {
    return this.sessionFilter() === 'all' ? 0 : 1;
  }

  tabLabel(tab: GroupDetailsTab): string {
    if (tab === 'sessions') {
      return 'Sessions';
    }
    if (tab === 'lessons') {
      return 'Lessons';
    }
    return tab === 'overview' ? 'Overview' : 'Enrolled Students';
  }

  sessionCountLabel(): string {
    const count = this.sessionRows().length;
    return `${count} ${count === 1 ? 'session' : 'sessions'}`;
  }

  filteredSessionCountLabel(): string {
    const filtered = this.filteredSessionRows().length;
    const total = this.sessionRows().length;
    if (filtered === total) {
      return this.sessionCountLabel();
    }
    return `${filtered} of ${total} sessions`;
  }

  sessionNumberLabel(rowIndex: number): string {
    const number = this.sessionPageIndex() * this.sessionPageSize() + rowIndex + 1;
    return this.i18n.language() === 'ar' ? `محاضرة ${number}` : `Session ${number}`;
  }

  sessionRelativeStatus(session: GroupSessionRow): SessionRelativeStatus | null {
    return this.sessionRelativeStatusById().get(session.id) ?? null;
  }

  sessionRelativeStatusLabel(status: SessionRelativeStatus): string {
    if (this.i18n.language() === 'ar') {
      return status === 'current' ? 'المحاضرة الحالية' : 'المحاضرة التالية';
    }
    return status === 'current' ? 'Current session' : 'Next session';
  }

  private currentSessionPageIndex(): number | null {
    const currentSessionId = Array.from(this.sessionRelativeStatusById().entries()).find(([, status]) => status === 'current')?.[0];
    if (!currentSessionId) {
      return null;
    }

    const currentFilteredIndex = this.filteredSessionRows().findIndex((session) => session.id === currentSessionId);
    if (currentFilteredIndex < 0) {
      return null;
    }

    return Math.floor(currentFilteredIndex / this.sessionPageSize());
  }

  private isGroupDetailsTab(value: string | null): value is GroupDetailsTab {
    return value === 'sessions' || value === 'enrolledStudents' || value === 'lessons' || value === 'overview';
  }

  openCalendar(): void {
    this.calendarOpen.set(true);
  }

  closeCalendar(): void {
    this.calendarOpen.set(false);
    this.eventEditorOpen.set(false);
    this.eventFormError.set(null);
  }

  openEventEditorFromButton(): void {
    const start = this.nextHourDate();
    this.openEventEditor(start, this.addDateMinutes(start, 60));
  }

  saveCalendarEvent(): void {
    this.eventFormError.set(null);
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      this.eventFormError.set('Add the event title, date, start time, and end time.');
      return;
    }

    const value = this.eventForm.getRawValue();
    const start = this.eventDateTime(value.date, value.startTime);
    const end = this.eventDateTime(value.date, value.endTime);
    if (!start || !end || end <= start) {
      this.eventFormError.set('End time must be after start time.');
      return;
    }

    this.customCalendarEvents.update((events) => [
      ...events,
      {
        id: `custom-${Date.now()}`,
        title: value.title.trim(),
        start: start.toISOString(),
        end: end.toISOString(),
        backgroundColor: '#0f766e',
        borderColor: '#0d9488',
      },
    ]);
    this.eventEditorOpen.set(false);
    this.eventForm.reset();
  }

  cancelCalendarEvent(): void {
    this.eventEditorOpen.set(false);
    this.eventFormError.set(null);
  }

  exitGroup(event: Event, student: GroupStudent): void {
    event.stopPropagation();
    this.facade.removeStudentFromGroup(this.groupId, student);
  }

  private calendarEvents(): EventInput[] {
    const group = this.group();
    if (!group) {
      return [];
    }

    const backendEvents = (group.calendarEvents ?? [])
      .map<EventInput | null>((event) => {
        const startTime = this.fullCalendarTime(event.startTime ?? '');
        const endTime = this.fullCalendarTime(event.endTime ?? '');
        if (!event.date || !startTime || !endTime) {
          return null;
        }
        return {
          id: event.id,
          title: this.calendarEventTitle(event.room || group.room),
          start: `${event.date}T${startTime}`,
          end: `${event.date}T${endTime}`,
          backgroundColor: '#4f46e5',
          borderColor: '#4338ca',
        } satisfies EventInput;
      })
      .filter((event): event is EventInput => event !== null);

    if (backendEvents.length > 0) {
      return backendEvents;
    }

    const dayScheduleEvents = Object.entries(group.daySchedules ?? {})
      .map<EventInput | null>(([day, schedule]) => {
        const dayIndex = this.dayIndex(day);
        const startTime = this.fullCalendarTime(schedule.startTime ?? '');
        const endTime = this.fullCalendarTime(schedule.endTime ?? '');

        if (dayIndex === null || !startTime || !endTime) {
          return null;
        }

        return {
          title: this.calendarEventTitle(schedule.room || group.room),
          daysOfWeek: [dayIndex],
          startTime,
          endTime,
          backgroundColor: '#4f46e5',
          borderColor: '#4338ca',
        } satisfies EventInput;
      })
      .filter((event): event is EventInput => event !== null);

    if (dayScheduleEvents.length > 0) {
      return dayScheduleEvents;
    }

    const startTime = this.fullCalendarTime(group.startAt ?? '');
    const duration = group.duration ?? null;
    if (!startTime || !duration || duration <= 0) {
      return [];
    }

    const endTime = this.fullCalendarTime(this.addMinutes(group.startAt ?? '', duration));
    if (!endTime) {
      return [];
    }

    return (group.scheduleDays ?? [])
      .map((day) => this.dayIndex(day))
      .filter((day): day is number => day !== null)
      .map((day) => ({
        title: this.calendarEventTitle(group.room),
        daysOfWeek: [day],
        startTime,
        endTime,
        backgroundColor: '#4f46e5',
        borderColor: '#4338ca',
      }));
  }

  private buildSessionRows(): GroupSessionRow[] {
    const group = this.group();
    if (!group) {
      return [];
    }

    if (group.calendarEvents?.length) {
      return group.calendarEvents.map((event) => ({
        id: event.id,
        day: event.day || this.weekdayLabel(event.date),
        date: event.date || 'Scheduled',
        timeRange: this.timeRange(event.startTime, event.endTime),
        room: event.room || group.room || 'No room',
        kind: 'dated',
        timelineStartMs: this.dateTimeMs(event.date, event.startTime),
        timelineEndMs: this.dateTimeMs(event.date, event.endTime),
      }));
    }

    const daySchedules = Object.entries(group.daySchedules ?? {});
    if (daySchedules.length) {
      return daySchedules.map(([day, schedule]) => {
        const timeline = this.nextRecurringSessionTimeline(day, schedule.startTime ?? '', schedule.endTime ?? '');
        return {
          id: `schedule-${day}`,
          day,
          date: 'Recurring',
          timeRange: this.timeRange(schedule.startTime ?? '', schedule.endTime ?? ''),
          room: schedule.room || group.room || 'No room',
          kind: 'recurring',
          timelineStartMs: timeline.startMs,
          timelineEndMs: timeline.endMs,
        };
      });
    }

    const startAt = group.startAt ?? '';
    const endAt = group.duration && group.duration > 0 ? this.addMinutes(startAt, group.duration) : '';
    return (group.scheduleDays ?? []).map((day) => {
      const timeline = this.nextRecurringSessionTimeline(day, startAt, endAt);
      return {
        id: `schedule-${day}`,
        day,
        date: 'Recurring',
        timeRange: this.timeRange(startAt, endAt),
        room: group.room || 'No room',
        kind: 'recurring',
        timelineStartMs: timeline.startMs,
        timelineEndMs: timeline.endMs,
      };
    });
  }

  private flattenCurriculumLessons(root: TenantSubjectCurriculumNode): CurriculumLessonOption[] {
    const lessons: CurriculumLessonOption[] = [];
    const visit = (node: TenantSubjectCurriculumNode, path: string[]): void => {
      const nextPath = node.id === 'curriculum' ? path : [...path, node.label];
      if (node.id !== 'curriculum' && !node.children.length) {
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

  private isLessonFilter(value: string): value is LessonFilter {
    return value === 'all' || value === 'withDescription' || value === 'withoutDescription';
  }

  private isEnrolledStudentFilter(value: string): value is EnrolledStudentFilter {
    return value === 'all' || value === 'present' || value === 'absent' || value === 'notMarked';
  }

  private timeRange(start: string, end: string): string {
    const startTime = this.displayTime(start);
    const endTime = this.displayTime(end);
    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    }
    return startTime || endTime || 'Time not set';
  }

  private displayTime(time: string): string {
    const normalized = this.fullCalendarTime(time);
    return normalized ? normalized.slice(0, 5) : '';
  }

  private weekdayLabel(date: string): string {
    const value = new Date(`${date}T00:00:00`);
    return Number.isNaN(value.getTime()) ? 'Scheduled' : value.toLocaleDateString('en-US', { weekday: 'long' });
  }

  private dateTimeMs(date: string, time: string): number | null {
    const normalizedTime = this.fullCalendarTime(time);
    if (!date || !normalizedTime) {
      return null;
    }
    const value = new Date(`${date}T${normalizedTime}`);
    return Number.isNaN(value.getTime()) ? null : value.getTime();
  }

  private nextRecurringSessionTimeline(day: string, startTime: string, endTime: string): { startMs: number | null; endMs: number | null } {
    const dayIndex = this.dayIndex(day);
    const startMinutes = this.timeMinutes(startTime);
    const endMinutes = this.timeMinutes(endTime);
    if (dayIndex === null || startMinutes === null) {
      return { startMs: null, endMs: null };
    }

    const now = new Date();
    const occurrence = new Date(now);
    occurrence.setHours(0, 0, 0, 0);
    occurrence.setDate(now.getDate() + ((dayIndex - now.getDay() + 7) % 7));
    occurrence.setMinutes(startMinutes);

    const startMs = occurrence.getTime();
    const endMs = endMinutes === null ? null : startMs + this.durationFromStart(startMinutes, endMinutes) * 60_000;
    if (endMs !== null && endMs <= now.getTime()) {
      const weekMs = 7 * 24 * 60 * 60_000;
      return { startMs: startMs + weekMs, endMs: endMs + weekMs };
    }

    if (endMs === null && startMs < now.getTime()) {
      return { startMs: startMs + 7 * 24 * 60 * 60_000, endMs: null };
    }

    return { startMs, endMs };
  }

  private openEventEditorFromSelection(selection: DateSelectArg): void {
    this.openEventEditor(selection.start, selection.end);
  }

  private openEventEditor(start: Date, end: Date): void {
    this.eventFormError.set(null);
    this.eventEditorOpen.set(true);
    this.eventForm.setValue({
      title: '',
      date: this.dateInputValue(start),
      startTime: this.timeInputValue(start),
      endTime: this.timeInputValue(end > start ? end : this.addDateMinutes(start, 60)),
    });
  }

  private calendarEventTitle(room: string | null | undefined): string {
    const name = this.group()?.name ?? 'Group session';
    const roomName = room?.trim();
    return roomName ? `${name} • ${roomName}` : name;
  }

  private dayIndex(day: string): number | null {
    const normalized = day.trim().toLowerCase();
    const days: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    return days[normalized] ?? null;
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

  private timeMinutes(time: string): number | null {
    const [hourPart, minutePart = '0'] = time.trim().split(':');
    const hour = Number(hourPart);
    const minute = Number(minutePart);
    if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }
    return hour * 60 + minute;
  }

  private durationFromStart(startMinutes: number, endMinutes: number): number {
    return endMinutes > startMinutes ? endMinutes - startMinutes : endMinutes + 24 * 60 - startMinutes;
  }

  private addMinutes(time: string, duration: number): string {
    const [hourPart, minutePart = '0'] = time.trim().split(':');
    const hour = Number(hourPart);
    const minute = Number(minutePart);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
      return '';
    }
    const totalMinutes = hour * 60 + minute + duration;
    const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
    const nextHour = Math.floor(normalizedMinutes / 60);
    const nextMinute = normalizedMinutes % 60;
    return `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`;
  }

  private nextHourDate(): Date {
    const date = new Date();
    date.setMinutes(0, 0, 0);
    date.setHours(date.getHours() + 1);
    return date;
  }

  private addDateMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60_000);
  }

  private dateInputValue(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private timeInputValue(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private eventDateTime(date: string, time: string): Date | null {
    const value = new Date(`${date}T${time}:00`);
    return Number.isNaN(value.getTime()) ? null : value;
  }
}
