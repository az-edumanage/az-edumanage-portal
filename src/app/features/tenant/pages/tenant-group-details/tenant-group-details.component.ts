import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, computed, effect, ElementRef, inject, OnDestroy, OnInit, PLATFORM_ID, signal, untracked, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { FullCalendarModule } from '@fullcalendar/angular';
import { Chart, registerables } from 'chart.js';
import { CalendarOptions, DateSelectArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { I18nService } from '../../../../core/services/i18n.service';
import { GroupDetails, GroupExamRow, GroupLesson, GroupLessonContent, GroupStudent } from '../../models/tenant-group-details.models';
import {
  TenantCurriculumMaterialFile,
  TenantCurriculumMaterialFolder,
  TenantCurriculumMaterialLink,
  TenantCurriculumMaterialNote,
  TenantSubjectCurriculumNode,
} from '../../models/tenant-subjects.models';
import { TenantGroupDetailsDataService } from '../../data-access/tenant-group-details-data.service';
import { TenantGroupDetailsFacade } from '../../state/tenant-group-details.facade';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';

Chart.register(...registerables);

type GroupDetailsTab = 'sessions' | 'enrolledStudents' | 'lessons' | 'library' | 'exams' | 'overview';
type SessionFilter = 'all' | 'dated' | 'recurring';
type SessionRelativeStatus = 'current' | 'next';
type LessonFilter = 'all' | 'withDescription' | 'withoutDescription';
type EnrolledStudentFilter = 'all' | 'present' | 'absent' | 'notMarked';
type LessonMaterialType = 'FILE' | 'NOTE' | 'LINK';
type LibraryContentFilter = 'all' | 'files' | 'notes' | 'links';

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

interface OverviewSessionStats {
  title: string;
  session: GroupSessionRow | null;
  total: number;
  present: number;
  absent: number;
  notMarked: number;
  marked: number;
  attendanceRate: number;
}

interface CurriculumLessonOption {
  id: string;
  title: string;
  path: string;
  description: string | null;
}

interface LessonMaterialSource {
  nodeId: string;
  nodeLabel: string;
  folder: TenantCurriculumMaterialFolder;
}

interface LessonMaterialOption {
  id: string;
  type: LessonMaterialType;
  title: string;
  subtitle: string;
  url: string | null;
  fileContentType: string | null;
  sizeBytes: number | null;
  source: LessonMaterialSource;
}

interface GroupLibraryFolder {
  nodeId: string;
  nodeLabel: string;
  folder: TenantCurriculumMaterialFolder;
}

interface GroupLibraryNodeTarget {
  nodeId: string;
  nodeLabel: string;
}

interface GroupLibraryFolderPreviewSlot {
  type: string;
  empty: boolean;
}

interface LibraryNoteBlock {
  data?: {
    text?: string;
    caption?: string;
    items?: string[];
  };
}

interface LibraryNoteContent {
  blocks?: LibraryNoteBlock[];
}

@Component({
  selector: 'app-tenant-group-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, MatIconModule, FullCalendarModule],
  templateUrl: './tenant-group-details.component.html',
  styleUrl: './tenant-group-details.component.css'})
export class TenantGroupDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly facade = inject(TenantGroupDetailsFacade);
  private readonly groupDetailsData = inject(TenantGroupDetailsDataService);
  private readonly subjectsData = inject(TenantSubjectsDataService);
  private readonly i18n = inject(I18nService);
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);
  private overviewAttendanceChartCanvas: ElementRef<HTMLCanvasElement> | null = null;
  private overviewAttendanceChart: Chart | null = null;

  @ViewChild('overviewAttendanceChart')
  set overviewAttendanceChartRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.overviewAttendanceChartCanvas = ref ?? null;
    if (ref) {
      this.renderOverviewAttendanceChart();
    }
  }

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
  readonly assignSessionDrawerOpen = signal(false);
  readonly assignSessionLesson = signal<GroupLesson | null>(null);
  readonly sessionLessonsLoading = signal(false);
  readonly sessionLessonsError = signal<string | null>(null);
  readonly sessionLessonsBySessionId = signal<ReadonlyMap<string, GroupLesson[]>>(new Map());
  readonly sessionLessonsLoadedKey = signal<string | null>(null);
  readonly assigningSessionId = signal<string | null>(null);
  readonly insertContentModalOpen = signal(false);
  readonly insertContentLesson = signal<GroupLesson | null>(null);
  readonly insertContentLoading = signal(false);
  readonly insertContentError = signal<string | null>(null);
  readonly insertContentOptions = signal<LessonMaterialOption[]>([]);
  readonly insertContentFolderFilter = signal('all');
  readonly selectedInsertContent = signal<LessonMaterialOption | null>(null);
  readonly insertingContent = signal(false);
  readonly insertedLessonContent = signal<GroupLessonContent[]>([]);
  readonly libraryLoading = signal(false);
  readonly libraryError = signal<string | null>(null);
  readonly libraryFolders = signal<GroupLibraryFolder[]>([]);
  readonly selectedLibraryFolder = signal<GroupLibraryFolder | null>(null);
  readonly libraryFiles = signal<TenantCurriculumMaterialFile[]>([]);
  readonly libraryNotes = signal<TenantCurriculumMaterialNote[]>([]);
  readonly libraryLinks = signal<TenantCurriculumMaterialLink[]>([]);
  readonly libraryContentLoading = signal(false);
  readonly libraryContentError = signal<string | null>(null);
  readonly librarySearchTerm = signal('');
  readonly libraryContentFilter = signal<LibraryContentFilter>('all');
  readonly libraryFolderModalOpen = signal(false);
  readonly libraryFolderName = signal('');
  readonly libraryFolderDescription = signal('');
  readonly libraryFolderTargetNodeId = signal<string | null>(null);
  readonly libraryFolderSaving = signal(false);
  readonly libraryFolderModalError = signal<string | null>(null);
  readonly libraryNoteModalOpen = signal(false);
  readonly editingLibraryNote = signal<TenantCurriculumMaterialNote | null>(null);
  readonly libraryNoteTitle = signal('');
  readonly libraryNoteContent = signal('');
  readonly libraryNoteSaving = signal(false);
  readonly libraryNoteError = signal<string | null>(null);
  readonly libraryLinkModalOpen = signal(false);
  readonly libraryLinkTitle = signal('');
  readonly libraryLinkUrl = signal('');
  readonly libraryLinkSaving = signal(false);
  readonly libraryLinkError = signal<string | null>(null);
  readonly libraryFileUploading = signal(false);
  readonly libraryPreviewContent = signal<GroupLessonContent | null>(null);
  readonly libraryPreviewNote = signal<TenantCurriculumMaterialNote | null>(null);
  readonly libraryPreviewLoading = signal(false);
  readonly libraryPreviewError = signal<string | null>(null);
  readonly libraryPreviewObjectUrl = signal<string | null>(null);
  readonly libraryPreviewSafeObjectUrl = signal<SafeResourceUrl | null>(null);
  readonly groupExams = signal<GroupExamRow[]>([]);
  readonly groupExamsLoading = signal(false);
  readonly groupExamsLoaded = signal(false);
  readonly groupExamsError = signal<string | null>(null);
  readonly groupExamsLoadedGroupId = signal<string | null>(null);
  readonly groupExamActionError = signal<string | null>(null);
  readonly deletingGroupExamId = signal<string | null>(null);
  readonly pendingDeleteGroupExam = signal<GroupExamRow | null>(null);
  readonly examSearchTerm = signal('');
  readonly examPageIndex = signal(0);
  readonly examPageSize = signal(5);
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
  readonly displayableGroupLessons = computed(() => {
    const leafIds = this.curriculumLessonLeafIds();
    if (!leafIds) {
      return this.groupLessons();
    }
    return this.groupLessons().filter((lesson) => leafIds.has(lesson.curriculumNodeId));
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
    return this.displayableGroupLessons().filter((lesson) => {
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
  readonly filteredGroupExams = computed(() => {
    const query = this.examSearchTerm().trim().toLowerCase();
    return this.groupExams().filter((exam) => {
      if (!query) {
        return true;
      }
      return [
        exam.title,
        exam.status,
        exam.date,
        exam.startTime ?? '',
        `${exam.duration} min`,
        exam.questionCount == null ? '' : `${exam.questionCount} questions`,
        exam.instructions ?? '',
      ].some((value) => value.toLowerCase().includes(query));
    });
  });
  readonly examTotalPages = computed(() => Math.max(1, Math.ceil(this.filteredGroupExams().length / this.examPageSize())));
  readonly pagedGroupExams = computed(() => {
    const pageIndex = this.examVisiblePageIndex();
    const start = pageIndex * this.examPageSize();
    return this.filteredGroupExams().slice(start, start + this.examPageSize());
  });
  readonly filteredLibraryFiles = computed(() => {
    if (this.libraryContentFilter() !== 'all' && this.libraryContentFilter() !== 'files') {
      return [];
    }
    const query = this.librarySearchTerm().trim().toLowerCase();
    return this.libraryFiles().filter((file) =>
      !query || [file.originalName, file.fileName, file.contentType ?? '', this.formatBytes(file.sizeBytes)].some((value) => value.toLowerCase().includes(query)),
    );
  });
  readonly filteredLibraryNotes = computed(() => {
    if (this.libraryContentFilter() !== 'all' && this.libraryContentFilter() !== 'notes') {
      return [];
    }
    const query = this.librarySearchTerm().trim().toLowerCase();
    return this.libraryNotes().filter((note) => !query || `${note.title} ${this.notePreview(note)}`.toLowerCase().includes(query));
  });
  readonly filteredLibraryLinks = computed(() => {
    if (this.libraryContentFilter() !== 'all' && this.libraryContentFilter() !== 'links') {
      return [];
    }
    const query = this.librarySearchTerm().trim().toLowerCase();
    return this.libraryLinks().filter((link) => !query || `${link.title} ${link.url}`.toLowerCase().includes(query));
  });
  readonly hasLibraryContent = computed(() =>
    this.filteredLibraryFiles().length > 0 || this.filteredLibraryNotes().length > 0 || this.filteredLibraryLinks().length > 0,
  );
  readonly insertContentFolderOptions = computed(() => {
    const byId = new Map<string, TenantCurriculumMaterialFolder>();
    for (const option of this.insertContentOptions()) {
      byId.set(option.source.folder.id, option.source.folder);
    }
    return Array.from(byId.values()).sort((first, second) => first.name.localeCompare(second.name));
  });
  readonly filteredInsertContentOptions = computed(() => {
    const folderId = this.insertContentFolderFilter();
    if (folderId === 'all') {
      return this.insertContentOptions();
    }
    return this.insertContentOptions().filter((option) => option.source.folder.id === folderId);
  });
  readonly libraryCreateTargets = computed<GroupLibraryNodeTarget[]>(() => {
    const root = this.lessonCurriculumRoot();
    return root ? this.libraryMaterialNodes(root, this.groupLessons()) : [];
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
  readonly overviewCurrentSessionStats = computed(() =>
    this.buildOverviewSessionStats('Current session', this.currentOverviewSession()),
  );
  readonly overviewLastSessionStats = computed(() =>
    this.buildOverviewSessionStats('Last session', this.lastOverviewSession()),
  );
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

    effect(() => {
      const group = this.group();
      const sessions = this.sessionRows();
      if (this.activeTab() !== 'sessions' || !this.isCurrentGroupReady(group) || !sessions.length) {
        return;
      }

      const sessionsKey = this.sessionLessonsKey(sessions);
      const loadedKey = untracked(() => this.sessionLessonsLoadedKey());
      const loading = untracked(() => this.sessionLessonsLoading());
      if (!loading && loadedKey !== sessionsKey) {
        void this.loadSessionLessons();
      }
    });

    effect(() => {
      const group = this.group();
      const loadedGroupId = untracked(() => this.groupExamsLoadedGroupId());
      if (group?.id && loadedGroupId && loadedGroupId !== group.id) {
        this.resetGroupExams();
      }
      if (this.activeTab() !== 'exams' || !group?.id) {
        return;
      }
      const loaded = untracked(() => this.groupExamsLoaded());
      const loading = untracked(() => this.groupExamsLoading());
      if (!loaded && !loading) {
        void this.loadGroupExams();
      }
    });

    effect(() => {
      const group = this.group();
      if (this.activeTab() !== 'library' || !this.isCurrentGroupReady(group)) {
        return;
      }

      const loading = untracked(() => this.libraryLoading());
      const hasFolders = untracked(() => this.libraryFolders().length > 0);
      const hasError = untracked(() => Boolean(this.libraryError()));
      if (!loading && !hasFolders && !hasError) {
        void this.loadGroupLibrary();
      }
    });

    effect(() => {
      this.students();
      this.overviewCurrentSessionStats();
      if (this.activeTab() !== 'overview') {
        this.destroyOverviewAttendanceChart();
        return;
      }

      queueMicrotask(() => this.renderOverviewAttendanceChart());
    });
  }

  ngOnInit(): void {
    this.facade.loadGroup(this.groupId);
    const requestedTab = this.route.snapshot.queryParamMap.get('tab');
    if (this.isGroupDetailsTab(requestedTab)) {
      this.selectTab(requestedTab);
    }
  }

  ngAfterViewInit(): void {
    if (this.activeTab() === 'overview') {
      this.renderOverviewAttendanceChart();
    }
  }

  ngOnDestroy(): void {
    this.destroyOverviewAttendanceChart();
    this.clearLibraryPreviewObjectUrl();
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
    } else if (tab === 'library') {
      void this.loadGroupLibrary();
    } else if (tab === 'exams') {
      void this.loadGroupExams();
    }
  }

  async loadGroupExams(force = false): Promise<void> {
    if (!this.groupId || this.groupExamsLoading() || (!force && this.groupExamsLoaded())) {
      return;
    }
    this.groupExamsLoading.set(true);
    this.groupExamsError.set(null);
    try {
      this.groupExams.set(await firstValueFrom(this.groupDetailsData.loadGroupExams(this.groupId)));
      this.groupExamsLoaded.set(true);
      this.groupExamsLoadedGroupId.set(this.group()?.id ?? this.groupId);
      this.examPageIndex.set(0);
    } catch (error) {
      this.groupExamsError.set(error instanceof Error ? error.message : 'Unable to load exams');
    } finally {
      this.groupExamsLoading.set(false);
    }
  }

  retryGroupExams(): void {
    void this.loadGroupExams(true);
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

  setExamSearchTerm(value: string): void {
    this.examSearchTerm.set(value);
    this.examPageIndex.set(0);
  }

  clearExamSearch(): void {
    this.examSearchTerm.set('');
    this.examPageIndex.set(0);
  }

  editGroupExam(_exam: GroupExamRow, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/tenant/groups', this.groupId, 'exam']);
  }

  requestDeleteGroupExam(exam: GroupExamRow, event?: Event): void {
    event?.stopPropagation();
    if (this.groupExamActionInProgress()) {
      return;
    }
    this.groupExamActionError.set(null);
    this.pendingDeleteGroupExam.set(exam);
  }

  closeDeleteGroupExamModal(): void {
    if (this.groupExamActionInProgress()) {
      return;
    }
    this.pendingDeleteGroupExam.set(null);
    this.groupExamActionError.set(null);
  }

  async confirmDeleteGroupExam(): Promise<void> {
    const exam = this.pendingDeleteGroupExam();
    if (!exam || this.groupExamActionInProgress()) {
      return;
    }
    this.deletingGroupExamId.set(exam.id);
    this.groupExamActionError.set(null);
    try {
      await firstValueFrom(this.groupDetailsData.deleteGroupExam(this.groupId, exam.id));
      this.groupExams.update((exams) => exams.filter((row) => row.id !== exam.id));
      this.pendingDeleteGroupExam.set(null);
      this.normalizeExamPageIndex();
    } catch (error) {
      this.groupExamActionError.set(error instanceof Error ? error.message : 'Unable to delete exam');
    } finally {
      this.deletingGroupExamId.set(null);
    }
  }

  groupExamActionInProgress(): boolean {
    return Boolean(this.deletingGroupExamId());
  }

  setExamPageSize(value: string | number): void {
    const size = Number(value);
    this.examPageSize.set(Number.isFinite(size) && size > 0 ? size : 5);
    this.examPageIndex.set(0);
  }

  previousExamPage(): void {
    this.examPageIndex.update((page) => Math.max(0, page - 1));
  }

  nextExamPage(): void {
    this.examPageIndex.update((page) => Math.min(this.examTotalPages() - 1, page + 1));
  }

  examPageStart(): number {
    const total = this.filteredGroupExams().length;
    return total === 0 ? 0 : this.examVisiblePageIndex() * this.examPageSize() + 1;
  }

  examPageEnd(): number {
    return Math.min(this.filteredGroupExams().length, this.examPageStart() + this.pagedGroupExams().length - 1);
  }

  examVisiblePageIndex(): number {
    return Math.min(this.examPageIndex(), this.examTotalPages() - 1);
  }

  examCountLabel(): string {
    const total = this.groupExams().length;
    const visible = this.filteredGroupExams().length;
    if (!total) {
      return 'No published exams';
    }
    if (visible !== total) {
      return `${visible} of ${total} exams`;
    }
    return total === 1 ? '1 published exam' : `${total} published exams`;
  }

  examTimeLabel(exam: GroupExamRow): string {
    return exam.startTime ? `${exam.date} at ${exam.startTime}` : `${exam.date} anytime`;
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

  async openLessonInsertContent(event: Event, lesson: GroupLesson): Promise<void> {
    event.stopPropagation();
    this.insertContentLesson.set(lesson);
    this.insertContentModalOpen.set(true);
    this.selectedInsertContent.set(null);
    this.insertContentFolderFilter.set('all');
    this.insertContentError.set(null);
    await this.loadInsertContentOptions(lesson);
  }

  closeInsertContentModal(): void {
    if (this.insertingContent()) {
      return;
    }
    this.insertContentModalOpen.set(false);
    this.insertContentLesson.set(null);
    this.selectedInsertContent.set(null);
    this.insertContentFolderFilter.set('all');
    this.insertContentError.set(null);
    this.insertContentOptions.set([]);
    this.insertedLessonContent.set([]);
  }

  selectInsertContent(option: LessonMaterialOption): void {
    this.selectedInsertContent.set(option);
    this.insertContentError.set(null);
  }

  setInsertContentFolderFilter(value: string): void {
    const folderId = value?.trim() || 'all';
    this.insertContentFolderFilter.set(folderId);
    const selected = this.selectedInsertContent();
    if (selected && folderId !== 'all' && selected.source.folder.id !== folderId) {
      this.selectedInsertContent.set(null);
    }
  }

  isInsertContentAlreadyAdded(option: LessonMaterialOption): boolean {
    return this.insertedLessonContent().some((content) => this.contentKey(content) === `${option.type}:${option.id}`);
  }

  async insertSelectedContent(): Promise<void> {
    const lesson = this.insertContentLesson();
    const option = this.selectedInsertContent();
    if (!lesson || !option || this.insertingContent()) {
      return;
    }

    this.insertingContent.set(true);
    this.insertContentError.set(null);
    try {
      const inserted = await firstValueFrom(this.groupDetailsData.addGroupLessonContent(this.groupId, lesson.id, {
        curriculumNodeId: option.source.nodeId,
        folderId: option.source.folder.id,
        contentType: option.type,
        contentId: option.id,
      }));
      this.insertedLessonContent.update((content) => this.mergeLessonContent(content, inserted));
      this.insertContentModalOpen.set(false);
      this.insertContentLesson.set(null);
      this.selectedInsertContent.set(null);
      this.insertContentFolderFilter.set('all');
      if (this.groupId) {
        await this.router.navigate(['/tenant/groups', this.groupId, 'lessons', lesson.id]);
      }
    } catch (error) {
      this.insertContentError.set(error instanceof Error ? error.message : 'Unable to insert content');
    } finally {
      this.insertingContent.set(false);
    }
  }

  async openLessonSessionAssignment(event: Event, lesson: GroupLesson): Promise<void> {
    event.stopPropagation();
    this.assignSessionLesson.set(lesson);
    this.assignSessionDrawerOpen.set(true);
    this.sessionLessonsError.set(null);
    await this.loadSessionLessons();
  }

  closeAssignSessionDrawer(): void {
    if (this.assigningSessionId()) {
      return;
    }
    this.assignSessionDrawerOpen.set(false);
    this.assignSessionLesson.set(null);
    this.sessionLessonsError.set(null);
  }

  sessionLessons(session: GroupSessionRow): GroupLesson[] {
    return this.sessionLessonsBySessionId().get(session.id) ?? [];
  }

  visibleSessionLessons(session: GroupSessionRow): GroupLesson[] {
    return this.sessionLessons(session).slice(0, 2);
  }

  hiddenSessionLessonsCount(session: GroupSessionRow): number {
    return Math.max(0, this.sessionLessons(session).length - this.visibleSessionLessons(session).length);
  }

  materialIcon(type: LessonMaterialType, fileContentType?: string | null): string {
    if (type === 'NOTE') {
      return 'sticky_note_2';
    }
    if (type === 'LINK') {
      return 'link';
    }
    const contentType = fileContentType?.toLowerCase() ?? '';
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

  materialTypeLabel(type: LessonMaterialType): string {
    const labels: Record<LessonMaterialType, string> = {
      FILE: 'File',
      NOTE: 'Note',
      LINK: 'Link',
    };
    return labels[type];
  }

  openLibraryNotePreview(note: TenantCurriculumMaterialNote): void {
    this.clearLibraryPreviewObjectUrl();
    this.libraryPreviewContent.set(this.libraryNoteToContent(note));
    this.libraryPreviewNote.set(note);
    this.libraryPreviewError.set(null);
    this.libraryPreviewLoading.set(false);
  }

  openLibraryFilePreview(file: TenantCurriculumMaterialFile): void {
    const content = this.libraryFileToContent(file);
    this.clearLibraryPreviewObjectUrl();
    this.libraryPreviewContent.set(content);
    this.libraryPreviewNote.set(null);
    this.libraryPreviewError.set(null);
    if (this.canPreviewContent(content)) {
      void this.loadLibraryPreviewFile(content);
      return;
    }
    this.libraryPreviewLoading.set(false);
  }

  closeLibraryContentPreview(): void {
    this.libraryPreviewContent.set(null);
    this.libraryPreviewNote.set(null);
    this.libraryPreviewLoading.set(false);
    this.libraryPreviewError.set(null);
    this.clearLibraryPreviewObjectUrl();
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

  notePreviewBlocks(note: TenantCurriculumMaterialNote | null): string[] {
    const blocks = this.parseLibraryNoteContent(note?.contentJson).blocks ?? [];
    const lines = blocks
      .flatMap((block) => this.libraryNoteBlockLines(block))
      .map((line) => this.stripHtml(line).trim())
      .filter(Boolean);
    return lines.length ? lines : [note ? this.notePreview(note) : 'No text in this note yet.'];
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

  libraryFolderCountLabel(): string {
    const count = this.libraryFolders().length;
    return count === 1 ? '1 folder' : `${count} folders`;
  }

  libraryFolderFilesLabel(folder: TenantCurriculumMaterialFolder): string {
    return folder.filesCount === 1 ? '1 item' : `${folder.filesCount} items`;
  }

  libraryVisibleContentLabel(): string {
    const count = this.filteredLibraryFiles().length + this.filteredLibraryNotes().length + this.filteredLibraryLinks().length;
    return count === 1 ? '1 result' : `${count} results`;
  }

  libraryFilterLabel(filter: LibraryContentFilter): string {
    const labels: Record<LibraryContentFilter, string> = {
      all: 'All content',
      files: 'Files',
      notes: 'Notes',
      links: 'External Links',
    };
    return labels[filter];
  }

  setLibrarySearchTerm(value: string): void {
    this.librarySearchTerm.set(value);
  }

  setLibraryContentFilter(value: string): void {
    this.libraryContentFilter.set(this.isLibraryContentFilter(value) ? value : 'all');
  }

  clearLibraryFilters(): void {
    this.librarySearchTerm.set('');
    this.libraryContentFilter.set('all');
  }

  async openCreateLibraryFolderModal(): Promise<void> {
    if (this.libraryLoading()) {
      return;
    }
    await this.loadGroupLibrary();
    this.libraryFolderName.set('');
    this.libraryFolderDescription.set('');
    this.libraryFolderTargetNodeId.set('group-library');
    this.libraryFolderModalError.set(null);
    this.libraryFolderModalOpen.set(true);
  }

  closeCreateLibraryFolderModal(): void {
    if (this.libraryFolderSaving()) {
      return;
    }
    this.libraryFolderModalOpen.set(false);
    this.libraryFolderModalError.set(null);
  }

  setLibraryFolderName(value: string): void {
    this.libraryFolderName.set(value);
  }

  setLibraryFolderDescription(value: string): void {
    this.libraryFolderDescription.set(value);
  }

  async createLibraryFolder(): Promise<void> {
    const group = this.group();
    const name = this.libraryFolderName().trim();
    if (!this.isCurrentGroupReady(group) || this.libraryFolderSaving()) {
      return;
    }
    if (!name) {
      this.libraryFolderModalError.set('Folder name is required.');
      return;
    }

    this.libraryFolderSaving.set(true);
    this.libraryFolderModalError.set(null);
    try {
      const folder = await firstValueFrom(this.groupDetailsData.createGroupLibraryFolder(this.groupId, {
        name,
        description: this.libraryFolderDescription().trim() || null,
      }));
      const createdFolder: GroupLibraryFolder = {
        nodeId: group.id,
        nodeLabel: 'Group Library',
        folder,
      };
      this.libraryFolderModalOpen.set(false);
      this.libraryFolders.update((folders) => [createdFolder, ...folders.filter((item) => item.folder.id !== folder.id)]);
      await this.openLibraryFolder(createdFolder);
    } catch (error) {
      this.libraryFolderModalError.set(this.subjectsData.toUserMessage(error, 'Unable to create library folder. Please try again.'));
    } finally {
      this.libraryFolderSaving.set(false);
    }
  }

  async openLibraryFolder(folder: GroupLibraryFolder): Promise<void> {
    const group = this.group();
    if (!group?.id || this.libraryContentLoading()) {
      return;
    }
    this.selectedLibraryFolder.set(folder);
    this.libraryContentLoading.set(true);
    this.libraryContentError.set(null);
    this.clearLibraryFilters();
    try {
      const [files, notes, links] = await Promise.all([
        firstValueFrom(this.groupDetailsData.loadGroupLibraryFiles(this.groupId, folder.folder.id)),
        firstValueFrom(this.groupDetailsData.loadGroupLibraryNotes(this.groupId, folder.folder.id)),
        firstValueFrom(this.groupDetailsData.loadGroupLibraryLinks(this.groupId, folder.folder.id)),
      ]);
      this.libraryFiles.set(files);
      this.libraryNotes.set(notes);
      this.libraryLinks.set(links);
    } catch (error) {
      this.libraryContentError.set(error instanceof Error ? error.message : 'Unable to load material folder');
      this.libraryFiles.set([]);
      this.libraryNotes.set([]);
      this.libraryLinks.set([]);
    } finally {
      this.libraryContentLoading.set(false);
    }
  }

  closeLibraryFolder(): void {
    this.selectedLibraryFolder.set(null);
    this.libraryFiles.set([]);
    this.libraryNotes.set([]);
    this.libraryLinks.set([]);
    this.libraryContentError.set(null);
    this.clearLibraryFilters();
  }

  openLibraryNoteModal(): void {
    this.editingLibraryNote.set(null);
    this.libraryNoteTitle.set('');
    this.libraryNoteContent.set('');
    this.libraryNoteError.set(null);
    this.libraryNoteModalOpen.set(true);
  }

  openLibraryNoteEditor(note: TenantCurriculumMaterialNote): void {
    this.clearLibraryPreviewObjectUrl();
    this.libraryPreviewContent.set(null);
    this.libraryPreviewNote.set(null);
    this.libraryPreviewError.set(null);
    this.libraryPreviewLoading.set(false);
    this.editingLibraryNote.set(note);
    this.libraryNoteTitle.set(note.title);
    this.libraryNoteContent.set(this.noteEditableText(note));
    this.libraryNoteError.set(null);
    this.libraryNoteModalOpen.set(true);
  }

  closeLibraryNoteModal(): void {
    if (this.libraryNoteSaving()) {
      return;
    }
    this.libraryNoteModalOpen.set(false);
    this.editingLibraryNote.set(null);
    this.libraryNoteError.set(null);
  }

  setLibraryNoteTitle(value: string): void {
    this.libraryNoteTitle.set(value);
  }

  setLibraryNoteContent(value: string): void {
    this.libraryNoteContent.set(value);
  }

  async saveLibraryNote(): Promise<void> {
    const folder = this.selectedLibraryFolder();
    const activeNote = this.editingLibraryNote();
    const content = this.libraryNoteContent().trim();
    if (!folder || this.libraryNoteSaving()) {
      return;
    }
    if (!content) {
      this.libraryNoteError.set('Note content is required.');
      return;
    }
    const title = this.libraryNoteTitle().trim() || content.split(/\r?\n/).find((line) => line.trim())?.trim().slice(0, 80) || 'Untitled note';
    const blocks = content
      .split(/\n{2,}/)
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text) => ({ type: 'paragraph', data: { text } }));
    this.libraryNoteSaving.set(true);
    this.libraryNoteError.set(null);
    try {
      const payload = {
        title,
        contentJson: JSON.stringify({ time: Date.now(), blocks, version: '2.31.0' }),
      };
      if (activeNote) {
        const note = await firstValueFrom(this.groupDetailsData.updateGroupLibraryNote(this.groupId, folder.folder.id, activeNote.id, payload));
        this.libraryNotes.update((notes) => notes.map((currentNote) => currentNote.id === note.id ? note : currentNote));
      } else {
        const note = await firstValueFrom(this.groupDetailsData.createGroupLibraryNote(this.groupId, folder.folder.id, payload));
        this.libraryNotes.update((notes) => [note, ...notes]);
        this.libraryFolders.update((folders) => this.updateLibraryFolderCount(folders, folder.folder.id, 'note'));
      }
      this.libraryNoteModalOpen.set(false);
      this.editingLibraryNote.set(null);
    } catch (error) {
      this.libraryNoteError.set(error instanceof Error ? error.message : activeNote ? 'Unable to update note' : 'Unable to create note');
    } finally {
      this.libraryNoteSaving.set(false);
    }
  }

  openLibraryLinkModal(): void {
    this.libraryLinkTitle.set('');
    this.libraryLinkUrl.set('');
    this.libraryLinkError.set(null);
    this.libraryLinkModalOpen.set(true);
  }

  closeLibraryLinkModal(): void {
    if (this.libraryLinkSaving()) {
      return;
    }
    this.libraryLinkModalOpen.set(false);
    this.libraryLinkError.set(null);
  }

  setLibraryLinkTitle(value: string): void {
    this.libraryLinkTitle.set(value);
  }

  setLibraryLinkUrl(value: string): void {
    this.libraryLinkUrl.set(value);
  }

  async createLibraryLink(): Promise<void> {
    const folder = this.selectedLibraryFolder();
    const title = this.libraryLinkTitle().trim();
    const url = this.libraryLinkUrl().trim();
    if (!folder || this.libraryLinkSaving()) {
      return;
    }
    if (!title || !url) {
      this.libraryLinkError.set('Link title and URL are required.');
      return;
    }
    this.libraryLinkSaving.set(true);
    this.libraryLinkError.set(null);
    try {
      const link = await firstValueFrom(this.groupDetailsData.createGroupLibraryLink(this.groupId, folder.folder.id, { title, url }));
      this.libraryLinks.update((links) => [link, ...links]);
      this.libraryFolders.update((folders) => this.updateLibraryFolderCount(folders, folder.folder.id, 'link'));
      this.libraryLinkModalOpen.set(false);
    } catch (error) {
      this.libraryLinkError.set(error instanceof Error ? error.message : 'Unable to create link');
    } finally {
      this.libraryLinkSaving.set(false);
    }
  }

  async uploadLibraryFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    const folder = this.selectedLibraryFolder();
    if (!file || !folder || this.libraryFileUploading()) {
      return;
    }
    this.libraryFileUploading.set(true);
    this.libraryContentError.set(null);
    try {
      const uploaded = await firstValueFrom(this.groupDetailsData.uploadGroupLibraryFile(this.groupId, folder.folder.id, file));
      this.libraryFiles.update((files) => [uploaded, ...files]);
      this.libraryFolders.update((folders) => this.updateLibraryFolderCount(folders, folder.folder.id, this.materialFileType(uploaded)));
    } catch (error) {
      this.libraryContentError.set(error instanceof Error ? error.message : 'Unable to upload file');
    } finally {
      input.value = '';
      this.libraryFileUploading.set(false);
    }
  }

  materialFolderIcon(type: string): string {
    const icons: Record<string, string> = {
      pdf: 'picture_as_pdf',
      word: 'description',
      powerpoint: 'slideshow',
      image: 'image',
      video: 'movie',
      note: 'sticky_note_2',
      link: 'link',
      file: 'insert_drive_file',
    };
    return icons[type] ?? 'insert_drive_file';
  }

  libraryFolderCoverSlots(folder: TenantCurriculumMaterialFolder): string[] {
    const types = folder.fileTypes.length ? folder.fileTypes : ['file'];
    const count = Math.max(folder.filesCount, types.length, 1);
    return Array.from({ length: Math.min(count, 4) }, (_item, index) => types[index % types.length] ?? 'file');
  }

  libraryFolderPreviewSlots(folder: TenantCurriculumMaterialFolder): GroupLibraryFolderPreviewSlot[] {
    const types = folder.fileTypes.length ? folder.fileTypes : [];
    return Array.from({ length: 4 }, (_item, index) => ({
      type: types[index % Math.max(types.length, 1)] ?? 'file',
      empty: index >= Math.max(folder.filesCount, types.length),
    }));
  }

  notePreview(note: TenantCurriculumMaterialNote): string {
    try {
      const parsed = JSON.parse(note.contentJson) as { blocks?: Array<{ data?: { text?: string } }> };
      const text = parsed.blocks?.map((block) => block.data?.text ?? '').find((value) => value.trim());
      return text ? text.replace(/<[^>]+>/g, '').trim() : 'No text in this note yet.';
    } catch {
      return note.contentJson ? note.contentJson.replace(/<[^>]+>/g, '').slice(0, 120) : 'No text in this note yet.';
    }
  }

  private noteEditableText(note: TenantCurriculumMaterialNote): string {
    try {
      const parsed = JSON.parse(note.contentJson) as { blocks?: Array<{ data?: { text?: string } }> };
      const lines = parsed.blocks
        ?.map((block) => (block.data?.text ?? '').replace(/<[^>]+>/g, '').trim())
        .filter(Boolean) ?? [];
      return lines.join('\n\n');
    } catch {
      return note.contentJson ? note.contentJson.replace(/<[^>]+>/g, '').trim() : '';
    }
  }

  private libraryNoteToContent(note: TenantCurriculumMaterialNote): GroupLessonContent {
    const folder = this.selectedLibraryFolder();
    return {
      id: `library-note-${note.id}`,
      curriculumNodeId: folder?.nodeId ?? this.groupId ?? 'group-library',
      curriculumNodeLabel: folder?.nodeLabel ?? 'Group Library',
      folderId: folder?.folder.id ?? '',
      folderName: folder?.folder.name ?? 'Library',
      contentType: 'NOTE',
      contentId: note.id,
      title: note.title,
      url: null,
      fileContentType: null,
      sizeBytes: null,
    };
  }

  private libraryFileToContent(file: TenantCurriculumMaterialFile): GroupLessonContent {
    const folder = this.selectedLibraryFolder();
    return {
      id: `library-file-${file.id}`,
      curriculumNodeId: folder?.nodeId ?? this.groupId ?? 'group-library',
      curriculumNodeLabel: folder?.nodeLabel ?? 'Group Library',
      folderId: folder?.folder.id ?? '',
      folderName: folder?.folder.name ?? 'Library',
      contentType: 'FILE',
      contentId: file.id,
      title: file.originalName || file.fileName,
      url: file.url,
      fileContentType: file.contentType,
      sizeBytes: file.sizeBytes,
    };
  }

  private async loadLibraryPreviewFile(content: GroupLessonContent): Promise<void> {
    if (!content.url) {
      this.libraryPreviewLoading.set(false);
      return;
    }

    this.libraryPreviewLoading.set(true);
    try {
      const blob = await firstValueFrom(this.http.get(content.url, { responseType: 'blob' }));
      const objectUrl = URL.createObjectURL(blob);
      this.libraryPreviewObjectUrl.set(objectUrl);
      this.libraryPreviewSafeObjectUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl));
      this.libraryPreviewError.set(null);
    } catch (error) {
      this.libraryPreviewError.set(error instanceof Error ? error.message : 'Unable to load file preview. Use Open to view this material.');
    } finally {
      this.libraryPreviewLoading.set(false);
    }
  }

  private parseLibraryNoteContent(contentJson: string | null | undefined): LibraryNoteContent {
    if (!contentJson) {
      return {};
    }
    try {
      const parsed = JSON.parse(contentJson) as LibraryNoteContent;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private libraryNoteBlockLines(block: LibraryNoteBlock): string[] {
    const data = block.data ?? {};
    if (Array.isArray(data.items)) {
      return data.items;
    }
    return [data.text, data.caption].filter((line): line is string => Boolean(line));
  }

  private stripHtml(value: string): string {
    return value.replace(/<[^>]*>/g, ' ');
  }

  private clearLibraryPreviewObjectUrl(): void {
    const objectUrl = this.libraryPreviewObjectUrl();
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    this.libraryPreviewObjectUrl.set(null);
    this.libraryPreviewSafeObjectUrl.set(null);
  }

  isLessonAssignedToSession(session: GroupSessionRow): boolean {
    const lesson = this.assignSessionLesson();
    if (!lesson) {
      return false;
    }
    return this.sessionLessons(session).some((assignedLesson) => assignedLesson.curriculumNodeId === lesson.curriculumNodeId);
  }

  sessionAssignmentLabel(session: GroupSessionRow): string {
    return this.isLessonAssignedToSession(session) ? 'Assigned' : 'Click to assign';
  }

  async assignLessonToSession(session: GroupSessionRow): Promise<void> {
    const lesson = this.assignSessionLesson();
    if (!lesson || this.isLessonAssignedToSession(session) || this.assigningSessionId()) {
      return;
    }

    this.assigningSessionId.set(session.id);
    this.sessionLessonsError.set(null);
    try {
      const assignedLesson = await firstValueFrom(
        this.groupDetailsData.addGroupLesson(this.groupId, lesson.curriculumNodeId, { sessionId: session.id }),
      );
      this.sessionLessonsBySessionId.update((lessonsBySessionId) => {
        const next = new Map(lessonsBySessionId);
        next.set(session.id, this.mergeGroupLessons(next.get(session.id) ?? [], [assignedLesson]));
        return next;
      });
    } catch (error) {
      this.sessionLessonsError.set(error instanceof Error ? error.message : 'Unable to assign lesson to session');
    } finally {
      this.assigningSessionId.set(null);
    }
  }

  activateLessonDetails(event: KeyboardEvent, lesson: GroupLesson): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    this.openLessonDetails(lesson);
  }

  private async loadSessionLessons(): Promise<void> {
    const sessions = this.sessionRows();
    if (!sessions.length) {
      this.sessionLessonsBySessionId.set(new Map());
      this.sessionLessonsLoadedKey.set(null);
      return;
    }

    const sessionsKey = this.sessionLessonsKey(sessions);
    this.sessionLessonsLoading.set(true);
    this.sessionLessonsError.set(null);
    try {
      const rows = await Promise.all(
        sessions.map(async (session) => ({
          sessionId: session.id,
          lessons: await firstValueFrom(this.groupDetailsData.loadGroupLessons(this.groupId, { sync: false, sessionId: session.id })),
        })),
      );
      this.sessionLessonsBySessionId.set(new Map(rows.map((row) => [row.sessionId, row.lessons])));
      this.sessionLessonsLoadedKey.set(sessionsKey);
    } catch (error) {
      this.sessionLessonsError.set(error instanceof Error ? error.message : 'Unable to load session lessons');
    } finally {
      this.sessionLessonsLoading.set(false);
    }
  }

  private sessionLessonsKey(sessions: GroupSessionRow[]): string {
    return `${this.groupId}:${sessions.map((session) => session.id).join('|')}`;
  }

  private async loadInsertContentOptions(lesson: GroupLesson): Promise<void> {
    if (!lesson.curriculumNodeId) {
      this.insertContentOptions.set([]);
      this.insertedLessonContent.set([]);
      return;
    }

    this.insertContentLoading.set(true);
    this.insertContentError.set(null);
    try {
      const [insertedContent, sources] = await Promise.all([
        firstValueFrom(this.groupDetailsData.loadGroupLessonContent(this.groupId, lesson.id)),
        this.loadGroupLibraryMaterialSources(),
      ]);
      const options = await Promise.all(
        sources.map((source) => this.loadGroupLibraryMaterialOptions(source)),
      );
      this.insertedLessonContent.set(insertedContent);
      this.insertContentOptions.set(options.flat());
    } catch (error) {
      this.insertContentError.set(error instanceof Error ? error.message : 'Unable to load material');
    } finally {
      this.insertContentLoading.set(false);
    }
  }

  private async loadGroupLibraryMaterialSources(): Promise<LessonMaterialSource[]> {
    const folders = this.libraryFolders().length
      ? this.libraryFolders().map((entry) => entry.folder)
      : await firstValueFrom(this.groupDetailsData.loadGroupLibraryFolders(this.groupId));
    if (!this.libraryFolders().length) {
      const group = this.group();
      this.libraryFolders.set(folders.map((folder) => ({
        nodeId: group?.id ?? 'group-library',
        nodeLabel: 'Group Library',
        folder,
      })));
    }
    return folders.map((folder) => ({
      nodeId: this.insertContentLesson()?.curriculumNodeId ?? this.group()?.id ?? 'group-library',
      nodeLabel: 'Group Library',
      folder,
    }));
  }

  private async loadGroupLibraryMaterialOptions(source: LessonMaterialSource): Promise<LessonMaterialOption[]> {
    const [files, notes, links] = await Promise.all([
      firstValueFrom(this.groupDetailsData.loadGroupLibraryFiles(this.groupId, source.folder.id)),
      firstValueFrom(this.groupDetailsData.loadGroupLibraryNotes(this.groupId, source.folder.id)),
      firstValueFrom(this.groupDetailsData.loadGroupLibraryLinks(this.groupId, source.folder.id)),
    ]);
    return [
      ...files.map((file) => this.fileOption(file, source)),
      ...notes.map((note) => this.noteOption(note, source)),
      ...links.map((link) => this.linkOption(link, source)),
    ];
  }

  private async loadGroupLibrary(): Promise<void> {
    const group = this.group();
    if (!this.isCurrentGroupReady(group) || this.libraryLoading() || this.libraryFolders().length) {
      return;
    }

    this.libraryLoading.set(true);
    this.libraryError.set(null);
    try {
      const folders = await firstValueFrom(this.groupDetailsData.loadGroupLibraryFolders(this.groupId));
      this.libraryFolders.set(folders.map((folder) => ({
        nodeId: group.id,
        nodeLabel: 'Group Library',
        folder,
      })));
    } catch (error) {
      this.libraryError.set(error instanceof Error ? error.message : 'Unable to load group library');
      this.libraryFolders.set([]);
    } finally {
      this.libraryLoading.set(false);
    }
  }

  private async ensureGroupLessonsLoadedForLibrary(): Promise<GroupLesson[]> {
    if (!this.lessonsLoaded()) {
      await this.loadGroupLessons();
    }
    return this.groupLessons();
  }

  private libraryMaterialNodes(root: TenantSubjectCurriculumNode, lessons: GroupLesson[]): Array<{ nodeId: string; nodeLabel: string }> {
    const byId = new Map<string, { nodeId: string; nodeLabel: string }>();
    for (const lesson of lessons) {
      const path = this.findNodePath([root], lesson.curriculumNodeId).filter((node) => this.isUuid(node.id));
      const parentNode = path.length > 1 ? path.at(-2) : path.at(-1);
      if (parentNode) {
        byId.set(parentNode.id, { nodeId: parentNode.id, nodeLabel: parentNode.label });
      }
    }
    if (byId.size) {
      return Array.from(byId.values());
    }
    const fallback = this.firstMaterialNode(root);
    return fallback ? [fallback] : [];
  }

  private firstMaterialNode(root: TenantSubjectCurriculumNode): { nodeId: string; nodeLabel: string } | null {
    if (this.isUuid(root.id)) {
      return { nodeId: root.id, nodeLabel: root.label };
    }
    for (const child of root.children ?? []) {
      const node = this.firstMaterialNode(child);
      if (node) {
        return node;
      }
    }
    return null;
  }

  private async withCurrentLibraryFolderCounts(
    subjectId: string,
    educationCategory: string | null | undefined,
    nodeId: string,
    folder: TenantCurriculumMaterialFolder,
  ): Promise<TenantCurriculumMaterialFolder> {
    try {
      const [files, notes, links] = await Promise.all([
        this.subjectsData.listCurriculumMaterialFiles(subjectId, nodeId, folder.id, educationCategory),
        this.subjectsData.listCurriculumMaterialNotes(subjectId, nodeId, folder.id, educationCategory),
        this.subjectsData.listCurriculumMaterialLinks(subjectId, nodeId, folder.id, educationCategory),
      ]);
      const fileTypes = [
        ...files.map((file) => this.materialFileType(file)),
        ...(notes.length ? ['note'] : []),
        ...(links.length ? ['link'] : []),
      ];
      return {
        ...folder,
        fileTypes: Array.from(new Set(fileTypes)),
        filesCount: files.length + notes.length + links.length,
      };
    } catch {
      return folder;
    }
  }

  private materialFileType(file: TenantCurriculumMaterialFile): string {
    const contentType = file.contentType?.toLowerCase() ?? '';
    const name = file.originalName.toLowerCase();
    if (contentType.includes('pdf') || name.endsWith('.pdf')) {
      return 'pdf';
    }
    if (contentType.includes('word') || contentType.includes('msword') || /\.(docx?|odt)$/.test(name)) {
      return 'word';
    }
    if (contentType.includes('presentation') || contentType.includes('powerpoint') || /\.(pptx?|odp)$/.test(name)) {
      return 'powerpoint';
    }
    if (contentType.startsWith('image/') || /\.(avif|gif|jpe?g|png|svg|webp)$/.test(name)) {
      return 'image';
    }
    if (contentType.startsWith('video/') || /\.(m4v|mov|mp4|mpeg|mpg|ogg|ogv|webm)$/.test(name)) {
      return 'video';
    }
    return 'file';
  }

  private async loadParentLessonMaterialSources(
    subjectId: string,
    educationCategory: string | null | undefined,
    curriculumNodeId: string,
  ): Promise<LessonMaterialSource[]> {
    const root = this.lessonCurriculumRoot()
      ?? await this.subjectsData.getSubjectCurriculumForCategory(subjectId, educationCategory);
    this.lessonCurriculumRoot.set(root);
    const path = this.findNodePath([root], curriculumNodeId).filter((node) => this.isUuid(node.id));
    const parentNode = path.length > 1 ? path.at(-2) : path.at(-1);
    if (!parentNode) {
      return [];
    }
    const folders = await this.subjectsData.listCurriculumMaterialFolders(subjectId, parentNode.id, educationCategory);
    return folders.map((folder) => ({ nodeId: parentNode.id, nodeLabel: parentNode.label, folder }));
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
      subtitle: this.formatBytes(file.sizeBytes) || 'File',
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
      subtitle: 'Note',
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
      subtitle: link.url,
      url: link.url,
      fileContentType: null,
      sizeBytes: null,
      source,
    };
  }

  private mergeLessonContent(current: GroupLessonContent[], inserted: GroupLessonContent): GroupLessonContent[] {
    return current.some((content) => this.contentKey(content) === this.contentKey(inserted))
      ? current.map((content) => this.contentKey(content) === this.contentKey(inserted) ? inserted : content)
      : [...current, inserted];
  }

  private contentKey(content: Pick<GroupLessonContent, 'contentType' | 'contentId'>): string {
    return `${content.contentType}:${content.contentId}`;
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
    if (tab === 'library') {
      return 'Library';
    }
    if (tab === 'exams') {
      return 'Exams';
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

  overviewSessionSubtitle(stats: OverviewSessionStats): string {
    const session = stats.session;
    return session ? `${session.day} · ${session.date} · ${session.timeRange}` : 'No session available';
  }

  overviewSessionRoomLabel(stats: OverviewSessionStats): string {
    return stats.session?.room || "No room";
  }

  overviewAttendanceChartSubtitle(): string {
    const stats = this.overviewCurrentSessionStats();
    return stats.present + " present, " + stats.absent + " absent, " + stats.notMarked + " not marked";
  }

  private renderOverviewAttendanceChart(): void {
    if (!isPlatformBrowser(this.platformId) || !this.overviewAttendanceChartCanvas) {
      return;
    }
    if (typeof window !== "undefined" && window.navigator.userAgent.toLowerCase().includes("jsdom")) {
      return;
    }

    let context: CanvasRenderingContext2D | null = null;
    try {
      context = this.overviewAttendanceChartCanvas.nativeElement.getContext("2d");
    } catch {
      return;
    }
    if (!context) {
      return;
    }

    const presentStudents = this.currentSessionPresentStudents();
    const labels = presentStudents.length ? presentStudents.map((student) => this.attendanceChartLabel(student)) : ["No present students"];
    const values = presentStudents.length ? presentStudents.map((_student, index) => index + 1) : [0];
    const maxValue = Math.max(1, presentStudents.length);

    this.destroyOverviewAttendanceChart();
    this.overviewAttendanceChart = new Chart(context, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Present students",
          data: values,
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: "#6366f1",
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => item.parsed.y + " present",
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: maxValue,
            ticks: { precision: 0, stepSize: 1 },
            grid: { color: "rgba(0,0,0,0.05)" },
          },
          x: {
            grid: { display: false },
            ticks: { maxRotation: 0, autoSkip: true },
          },
        },
      },
    });
  }

  private destroyOverviewAttendanceChart(): void {
    this.overviewAttendanceChart?.destroy();
    this.overviewAttendanceChart = null;
  }

  private currentSessionPresentStudents(): GroupStudent[] {
    return [...this.students()]
      .filter((student) => student.attendanceState === "Present")
      .sort((first, second) => this.attendanceSortValue(first) - this.attendanceSortValue(second));
  }

  private attendanceSortValue(student: GroupStudent): number {
    const value = student.attendanceTime?.trim();
    if (!value) {
      return Number.MAX_SAFE_INTEGER;
    }
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
  }

  private attendanceChartLabel(student: GroupStudent): string {
    const attendanceTime = student.attendanceTime?.trim();
    if (!attendanceTime) {
      return student.name;
    }
    const date = new Date(attendanceTime);
    if (Number.isNaN(date.getTime())) {
      return student.name;
    }
    return date.getHours().toString().padStart(2, "0") + ":" + date.getMinutes().toString().padStart(2, "0");
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

  private currentOverviewSession(): GroupSessionRow | null {
    const currentSessionId = Array.from(this.sessionRelativeStatusById().entries()).find(([, status]) => status === 'current')?.[0];
    return this.sessionRows().find((session) => session.id === currentSessionId) ?? null;
  }

  private lastOverviewSession(): GroupSessionRow | null {
    const now = Date.now();
    return this.sessionRows()
      .filter((session) => session.timelineEndMs !== null && session.timelineEndMs < now)
      .sort((first, second) => (second.timelineEndMs ?? 0) - (first.timelineEndMs ?? 0))[0] ?? null;
  }

  private buildOverviewSessionStats(title: string, session: GroupSessionRow | null): OverviewSessionStats {
    const total = this.students().length;
    const present = this.students().filter((student) => student.attendanceState === 'Present').length;
    const absent = this.students().filter((student) => student.attendanceState === 'Absent').length;
    const notMarked = Math.max(0, total - present - absent);
    const marked = present + absent;

    return {
      title,
      session,
      total,
      present,
      absent,
      notMarked,
      marked,
      attendanceRate: total ? Math.round((present / total) * 100) : 0,
    };
  }

  private isGroupDetailsTab(value: string | null): value is GroupDetailsTab {
    return value === 'sessions' || value === 'enrolledStudents' || value === 'lessons' || value === 'library' || value === 'exams' || value === 'overview';
  }

  private resetGroupExams(): void {
    this.groupExams.set([]);
    this.groupExamsLoading.set(false);
    this.groupExamsLoaded.set(false);
    this.groupExamsError.set(null);
    this.groupExamActionError.set(null);
    this.deletingGroupExamId.set(null);
    this.pendingDeleteGroupExam.set(null);
    this.groupExamsLoadedGroupId.set(null);
    this.examSearchTerm.set('');
    this.examPageIndex.set(0);
  }

  private normalizeExamPageIndex(): void {
    this.examPageIndex.set(Math.min(this.examPageIndex(), this.examTotalPages() - 1));
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

  private curriculumLessonLeafIds(): Set<string> | null {
    const root = this.lessonCurriculumRoot();
    if (!root) {
      return null;
    }
    return new Set(this.flattenCurriculumLessons(root).map((lesson) => lesson.id));
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

  private updateLibraryFolderCount(folders: GroupLibraryFolder[], folderId: string, type: string): GroupLibraryFolder[] {
    return folders.map((folder) => folder.folder.id === folderId
      ? {
          ...folder,
          folder: {
            ...folder.folder,
            filesCount: folder.folder.filesCount + 1,
            fileTypes: Array.from(new Set([...folder.folder.fileTypes, type])),
          },
        }
      : folder);
  }

  private isLessonFilter(value: string): value is LessonFilter {
    return value === 'all' || value === 'withDescription' || value === 'withoutDescription';
  }

  private isEnrolledStudentFilter(value: string): value is EnrolledStudentFilter {
    return value === 'all' || value === 'present' || value === 'absent' || value === 'notMarked';
  }

  private isLibraryContentFilter(value: string): value is LibraryContentFilter {
    return value === 'all' || value === 'files' || value === 'notes' || value === 'links';
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
