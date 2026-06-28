import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { GroupDetails, GroupLesson, GroupLessonContent } from '../../models/tenant-group-details.models';
import {
  TenantCurriculumMaterialFile,
  TenantCurriculumMaterialFolder,
  TenantCurriculumMaterialLink,
  TenantCurriculumMaterialNote,
  TenantSubjectCurriculumNode,
} from '../../models/tenant-subjects.models';
import { TenantGroupDetailsDataService } from '../../data-access/tenant-group-details-data.service';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';

type LessonMaterialType = 'FILE' | 'NOTE' | 'LINK';
type LessonContentFilter = 'all' | LessonMaterialType;

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

interface LessonNoteBlock {
  type?: string;
  data?: {
    text?: string;
    caption?: string;
    items?: string[];
  };
}

interface LessonNoteContent {
  blocks?: LessonNoteBlock[];
}

interface LessonSessionRow {
  id: string;
  day: string;
  date: string;
  startTime: string;
  endTime: string;
  timeRange: string;
  room: string;
  kind: 'dated' | 'recurring';
}

@Component({
  selector: 'app-tenant-group-lesson-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-group-lesson-details.component.html',
  styleUrl: './tenant-group-lesson-details.component.css',
})
export class TenantGroupLessonDetailsComponent implements OnInit, OnDestroy {
  private readonly contentRefreshIntervalMs = 5000;
  private contentRefreshTimer: ReturnType<typeof setInterval> | null = null;
  private refreshingLessonMaterial = false;
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly data = inject(TenantGroupDetailsDataService);
  private readonly subjectsData = inject(TenantSubjectsDataService);

  readonly groupId = this.route.snapshot.paramMap.get('id');
  readonly lessonId = this.route.snapshot.paramMap.get('lessonId');
  readonly group = signal<GroupDetails | null>(null);
  readonly lessons = signal<GroupLesson[]>([]);
  readonly lessonContent = signal<GroupLessonContent[]>([]);
  private readonly insertedLessonContent = signal<GroupLessonContent[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly contentLoading = signal(false);
  readonly contentError = signal<string | null>(null);
  readonly insertModalOpen = signal(false);
  readonly materialLoading = signal(false);
  readonly materialError = signal<string | null>(null);
  readonly materialOptions = signal<LessonMaterialOption[]>([]);
  readonly selectedMaterial = signal<LessonMaterialOption | null>(null);
  readonly insertingContent = signal(false);
  readonly insertError = signal<string | null>(null);
  readonly previewContent = signal<GroupLessonContent | null>(null);
  readonly previewNote = signal<TenantCurriculumMaterialNote | null>(null);
  readonly previewLoading = signal(false);
  readonly previewError = signal<string | null>(null);
  readonly assignSessionDrawerOpen = signal(false);
  readonly sessionLessonsLoading = signal(false);
  readonly sessionLessonsError = signal<string | null>(null);
  readonly sessionLessonsBySessionId = signal<ReadonlyMap<string, GroupLesson[]>>(new Map());
  readonly assigningSessionId = signal<string | null>(null);
  readonly contentSearchTerm = signal('');
  readonly contentFilter = signal<LessonContentFilter>('all');
  readonly contentPageIndex = signal(0);
  readonly contentPageSize = signal(5);
  readonly lesson = computed(() => this.lessons().find((row) => row.id === this.lessonId) ?? null);
  readonly sessionRows = computed<LessonSessionRow[]>(() => this.buildSessionRows(this.group()));
  readonly fileMaterialCount = computed(() => this.lessonContent().filter((content) => content.contentType === 'FILE').length);
  readonly noteMaterialCount = computed(() => this.lessonContent().filter((content) => content.contentType === 'NOTE').length);
  readonly linkMaterialCount = computed(() => this.lessonContent().filter((content) => content.contentType === 'LINK').length);
  readonly subjectBaseRoute = computed(() => {
    const group = this.group();
    return group?.educationCategory === 'UNIVERSITY_EDUCATION' ? '/tenant/university-subjects' : '/tenant/subjects';
  });
  readonly filteredLessonContent = computed(() => {
    const query = this.contentSearchTerm().trim().toLowerCase();
    const filter = this.contentFilter();
    return this.lessonContent().filter((content) => {
      const matchesFilter = filter === 'all' || content.contentType === filter;
      const matchesSearch =
        !query ||
        [
          content.title,
          this.materialTypeLabel(content.contentType),
          content.folderName,
          content.curriculumNodeLabel,
          this.formatBytes(content.sizeBytes),
        ].some((value) => value.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  });
  readonly contentTotalPages = computed(() => Math.max(1, Math.ceil(this.filteredLessonContent().length / this.contentPageSize())));
  readonly pagedLessonContent = computed(() => {
    const pageIndex = this.contentVisiblePageIndex();
    const start = pageIndex * this.contentPageSize();
    return this.filteredLessonContent().slice(start, start + this.contentPageSize());
  });

  ngOnInit(): void {
    void this.loadLessonDetails();
  }

  ngOnDestroy(): void {
    this.stopLessonMaterialRefresh();
  }

  @HostListener('document:keydown.escape')
  closeOpenPanels(): void {
    if (this.previewContent()) {
      this.closeContentPreview();
      return;
    }
    if (this.assignSessionDrawerOpen()) {
      this.closeAssignSessionDrawer();
      return;
    }
    if (this.insertModalOpen()) {
      this.closeInsertContentModal();
    }
  }

  private async loadLessonDetails(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const [group, lessons] = await Promise.all([
        firstValueFrom(this.data.loadGroupById(this.groupId)),
        firstValueFrom(this.data.loadGroupLessons(this.groupId)),
      ]);
      this.group.set(group);
      this.lessons.set(lessons);
      await this.loadLessonContent();
      this.startLessonMaterialRefresh();
      if (this.route.snapshot.queryParamMap.get('insertContent') === 'true') {
        await this.openInsertContentModal();
      }
      if (this.route.snapshot.queryParamMap.get('assignSession') === 'true') {
        await this.openAssignSessionDrawer();
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load lesson details');
    } finally {
      this.isLoading.set(false);
    }
  }

  async openInsertContentModal(): Promise<void> {
    this.insertModalOpen.set(true);
    this.selectedMaterial.set(null);
    this.insertError.set(null);
    await this.loadAvailableMaterial();
  }

  closeInsertContentModal(): void {
    if (this.insertingContent()) {
      return;
    }
    this.insertModalOpen.set(false);
    this.selectedMaterial.set(null);
    this.insertError.set(null);
  }

  selectMaterial(option: LessonMaterialOption): void {
    this.selectedMaterial.set(option);
    this.insertError.set(null);
  }

  async insertSelectedMaterial(): Promise<void> {
    const group = this.group();
    const lesson = this.lesson();
    const option = this.selectedMaterial();
    if (!group?.subjectId || !lesson || !option || this.insertingContent()) {
      return;
    }
    this.insertingContent.set(true);
    this.insertError.set(null);
    try {
      const inserted = await firstValueFrom(this.data.addGroupLessonContent(this.groupId, lesson.id, {
        curriculumNodeId: option.source.nodeId,
        folderId: option.source.folder.id,
        contentType: option.type,
        contentId: option.id,
      }));
      this.insertedLessonContent.update((content) => this.mergeContent(content, inserted));
      this.lessonContent.update((content) => this.mergeContent(content, inserted));
      this.insertModalOpen.set(false);
      this.selectedMaterial.set(null);
    } catch (error) {
      this.insertError.set(error instanceof Error ? error.message : 'Unable to insert content');
    } finally {
      this.insertingContent.set(false);
    }
  }

  async openAssignSessionDrawer(): Promise<void> {
    this.assignSessionDrawerOpen.set(true);
    this.sessionLessonsError.set(null);
    await this.loadSessionLessons();
  }

  closeAssignSessionDrawer(): void {
    if (this.assigningSessionId()) {
      return;
    }
    this.assignSessionDrawerOpen.set(false);
    this.sessionLessonsError.set(null);
  }

  sessionLessons(session: LessonSessionRow): GroupLesson[] {
    return this.sessionLessonsBySessionId().get(session.id) ?? [];
  }

  isLessonAssignedToSession(session: LessonSessionRow): boolean {
    const lesson = this.lesson();
    if (!lesson) {
      return false;
    }
    return this.sessionLessons(session).some((assignedLesson) => assignedLesson.curriculumNodeId === lesson.curriculumNodeId);
  }

  sessionAssignmentLabel(session: LessonSessionRow): string {
    return this.isLessonAssignedToSession(session) ? 'Assigned' : 'Click to assign';
  }

  async assignLessonToSession(session: LessonSessionRow): Promise<void> {
    const lesson = this.lesson();
    if (!lesson || this.isLessonAssignedToSession(session) || this.assigningSessionId()) {
      return;
    }

    this.assigningSessionId.set(session.id);
    this.sessionLessonsError.set(null);
    try {
      const assignedLesson = await firstValueFrom(this.data.addGroupLesson(this.groupId, lesson.curriculumNodeId, { sessionId: session.id }));
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

  materialIcon(type: LessonMaterialType | GroupLessonContent['contentType'], fileContentType?: string | null): string {
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

  materialTypeLabel(type: LessonMaterialType | GroupLessonContent['contentType']): string {
    const labels: Record<LessonMaterialType, string> = {
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

  materialCountLabel(): string {
    const count = this.lessonContent().length;
    return `${count} ${count === 1 ? 'available material' : 'available materials'}`;
  }

  filteredMaterialCountLabel(): string {
    const filtered = this.filteredLessonContent().length;
    const total = this.lessonContent().length;
    if (filtered === total) {
      return this.materialCountLabel();
    }
    return `${filtered} of ${total} materials`;
  }

  setContentSearchTerm(value: string): void {
    this.contentSearchTerm.set(value);
    this.contentPageIndex.set(0);
  }

  setContentFilter(value: string): void {
    this.contentFilter.set(this.isContentFilter(value) ? value : 'all');
    this.contentPageIndex.set(0);
  }

  setContentPageSize(value: string): void {
    this.contentPageSize.set(Number(value));
    this.contentPageIndex.set(0);
  }

  previousContentPage(): void {
    this.contentPageIndex.update((page) => Math.max(0, page - 1));
  }

  nextContentPage(): void {
    this.contentPageIndex.update((page) => Math.min(this.contentTotalPages() - 1, page + 1));
  }

  contentPageStart(): number {
    const total = this.filteredLessonContent().length;
    return total === 0 ? 0 : this.contentVisiblePageIndex() * this.contentPageSize() + 1;
  }

  contentPageEnd(): number {
    return Math.min(this.filteredLessonContent().length, this.contentPageStart() + this.pagedLessonContent().length - 1);
  }

  activeContentFiltersCount(): number {
    return (this.contentSearchTerm().trim() ? 1 : 0) + (this.contentFilter() === 'all' ? 0 : 1);
  }

  clearContentFilters(): void {
    this.contentSearchTerm.set('');
    this.contentFilter.set('all');
    this.contentPageIndex.set(0);
  }

  contentVisiblePageIndex(): number {
    return Math.min(this.contentPageIndex(), this.contentTotalPages() - 1);
  }

  isMaterialInserted(option: LessonMaterialOption): boolean {
    return this.insertedLessonContent().some((content) => content.contentType === option.type && content.contentId === option.id);
  }

  canOpenContent(content: GroupLessonContent): boolean {
    return Boolean(content.url || content.contentType === 'NOTE');
  }

  contentActionLabel(content: GroupLessonContent): string {
    return content.contentType === 'LINK' ? 'Open link details' : `Preview ${content.title}`;
  }

  async openInsertedContent(content: GroupLessonContent): Promise<void> {
    if (!this.canOpenContent(content)) {
      return;
    }

    this.previewContent.set(content);
    this.previewNote.set(null);
    this.previewError.set(null);
    if (content.contentType !== 'NOTE') {
      this.previewLoading.set(false);
      return;
    }

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

  openInsertedContentFromKeyboard(event: KeyboardEvent, content: GroupLessonContent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    void this.openInsertedContent(content);
  }

  closeContentPreview(): void {
    this.previewContent.set(null);
    this.previewNote.set(null);
    this.previewLoading.set(false);
    this.previewError.set(null);
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

  contentHostLabel(content: GroupLessonContent): string {
    if (!content.url) {
      return content.folderName;
    }
    try {
      return new URL(content.url).hostname.replace(/^www\./, '');
    } catch {
      return content.url;
    }
  }

  notePreviewBlocks(note: TenantCurriculumMaterialNote | null): string[] {
    const blocks = this.parseNoteContent(note?.contentJson).blocks ?? [];
    const lines = blocks
      .flatMap((block) => this.noteBlockLines(block))
      .map((line) => this.stripHtml(line).trim())
      .filter(Boolean);
    return lines.length ? lines : ['No text in this note yet.'];
  }

  private async loadLessonContent(): Promise<void> {
    this.contentLoading.set(true);
    this.contentError.set(null);
    try {
      const [insertedContent, materialContent] = await Promise.all([
        firstValueFrom(this.data.loadGroupLessonContent(this.groupId, this.lessonId)),
        this.loadLessonMaterialContent(),
      ]);
      this.insertedLessonContent.set(insertedContent);
      this.lessonContent.set(this.mergeContentList(insertedContent, materialContent));
    } catch (error) {
      this.contentError.set(error instanceof Error ? error.message : 'Unable to load lesson content');
    } finally {
      this.contentLoading.set(false);
    }
  }

  private startLessonMaterialRefresh(): void {
    this.stopLessonMaterialRefresh();
    this.contentRefreshTimer = setInterval(() => {
      void this.refreshLessonMaterialContent();
    }, this.contentRefreshIntervalMs);
  }

  private stopLessonMaterialRefresh(): void {
    if (!this.contentRefreshTimer) {
      return;
    }
    clearInterval(this.contentRefreshTimer);
    this.contentRefreshTimer = null;
  }

  private async refreshLessonMaterialContent(): Promise<void> {
    if (this.refreshingLessonMaterial) {
      return;
    }
    this.refreshingLessonMaterial = true;
    try {
      const materialContent = await this.loadLessonMaterialContent();
      this.lessonContent.set(this.mergeContentList(this.lessonContent(), materialContent));
      this.contentError.set(null);
    } catch (error) {
      this.contentError.set(error instanceof Error ? error.message : 'Unable to load lesson content');
    } finally {
      this.refreshingLessonMaterial = false;
    }
  }

  private async loadLessonMaterialContent(): Promise<GroupLessonContent[]> {
    const group = this.group();
    const lesson = this.lesson();
    if (!group?.subjectId || !lesson?.curriculumNodeId) {
      return [];
    }
    const sources = await this.loadDirectLessonMaterialSources(group.subjectId, group.educationCategory, lesson.curriculumNodeId);
    const options = await Promise.all(sources.map((source) => this.loadMaterialOptions(group.subjectId ?? '', group.educationCategory, source)));
    return options.flat().map((option) => this.materialOptionToContent(option));
  }

  private async loadAvailableMaterial(): Promise<void> {
    const lesson = this.lesson();
    if (!lesson?.curriculumNodeId) {
      this.materialOptions.set([]);
      return;
    }
    this.materialLoading.set(true);
    this.materialError.set(null);
    try {
      const sources = await this.loadGroupLibraryMaterialSources(lesson);
      const options = await Promise.all(sources.map((source) => this.loadGroupLibraryMaterialOptions(source)));
      this.materialOptions.set(options.flat());
    } catch (error) {
      this.materialError.set(error instanceof Error ? error.message : 'Unable to load material');
    } finally {
      this.materialLoading.set(false);
    }
  }

  private async loadGroupLibraryMaterialSources(lesson: GroupLesson): Promise<LessonMaterialSource[]> {
    const folders = await firstValueFrom(this.data.loadGroupLibraryFolders(this.groupId));
    return folders.map((folder) => ({
      nodeId: lesson.curriculumNodeId,
      nodeLabel: 'Group Library',
      folder,
    }));
  }

  private async loadGroupLibraryMaterialOptions(source: LessonMaterialSource): Promise<LessonMaterialOption[]> {
    const [files, notes, links] = await Promise.all([
      firstValueFrom(this.data.loadGroupLibraryFiles(this.groupId, source.folder.id)),
      firstValueFrom(this.data.loadGroupLibraryNotes(this.groupId, source.folder.id)),
      firstValueFrom(this.data.loadGroupLibraryLinks(this.groupId, source.folder.id)),
    ]);
    return [
      ...files.map((file) => this.fileOption(file, source)),
      ...notes.map((note) => this.noteOption(note, source)),
      ...links.map((link) => this.linkOption(link, source)),
    ];
  }

  private async loadSessionLessons(): Promise<void> {
    const sessions = this.sessionRows();
    if (!sessions.length) {
      this.sessionLessonsBySessionId.set(new Map());
      return;
    }

    this.sessionLessonsLoading.set(true);
    this.sessionLessonsError.set(null);
    try {
      const rows = await Promise.all(
        sessions.map(async (session) => ({
          sessionId: session.id,
          lessons: await firstValueFrom(this.data.loadGroupLessons(this.groupId, { sync: false, sessionId: session.id })),
        })),
      );
      this.sessionLessonsBySessionId.set(new Map(rows.map((row) => [row.sessionId, row.lessons])));
    } catch (error) {
      this.sessionLessonsError.set(error instanceof Error ? error.message : 'Unable to load session lessons');
    } finally {
      this.sessionLessonsLoading.set(false);
    }
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

  private async loadParentLessonMaterialSources(
    subjectId: string,
    educationCategory: string | null | undefined,
    curriculumNodeId: string,
  ): Promise<LessonMaterialSource[]> {
    const root = await this.subjectsData.getSubjectCurriculumForCategory(subjectId, educationCategory);
    const path = this.findNodePath([root], curriculumNodeId)
      .filter((node) => this.isUuid(node.id));
    const parentNode = path.length > 1 ? path.at(-2) : path.at(-1);
    if (!parentNode) {
      return [];
    }
    const folders = await this.subjectsData.listCurriculumMaterialFolders(subjectId, parentNode.id, educationCategory);
    return folders.map((folder) => ({ nodeId: parentNode.id, nodeLabel: parentNode.label, folder }));
  }

  private async loadMaterialOptions(subjectId: string, educationCategory: string | null | undefined, source: LessonMaterialSource): Promise<LessonMaterialOption[]> {
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
      url: option.url,
      fileContentType: option.fileContentType,
      sizeBytes: option.sizeBytes,
    };
  }

  private mergeContent(content: GroupLessonContent[], inserted: GroupLessonContent): GroupLessonContent[] {
    return content.some((row) => this.contentKey(row) === this.contentKey(inserted))
      ? content.map((row) => this.contentKey(row) === this.contentKey(inserted) ? inserted : row)
      : [...content, inserted];
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

  private contentKey(content: Pick<GroupLessonContent, 'contentType' | 'contentId' | 'folderId'>): string {
    return `${content.contentType}:${content.folderId}:${content.contentId}`;
  }

  private isContentFilter(value: string): value is LessonContentFilter {
    return value === 'all' || value === 'FILE' || value === 'NOTE' || value === 'LINK';
  }

  private buildSessionRows(group: GroupDetails | null): LessonSessionRow[] {
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

  private weekdayLabel(date: string): string {
    const value = new Date(`${date}T00:00:00`);
    return Number.isNaN(value.getTime()) ? 'Scheduled' : value.toLocaleDateString('en-US', { weekday: 'long' });
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

  private addMinutes(time: string, minutes: number): string {
    const normalized = this.fullCalendarTime(time);
    if (!normalized) {
      return '';
    }
    const [hourPart, minutePart] = normalized.split(':');
    const total = Number(hourPart) * 60 + Number(minutePart) + minutes;
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

  private findNodePath(nodes: TenantSubjectCurriculumNode[], nodeId: string, parents: TenantSubjectCurriculumNode[] = []): TenantSubjectCurriculumNode[] {
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
}
