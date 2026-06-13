import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, DestroyRef, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import 'mathlive';
import { I18nService } from '../../../../core/services/i18n.service';
import { TenantQuestionType, TenantQuestionTypeSettingsService } from '../../data-access/tenant-question-type-settings.service';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantCurriculumMaterialFile, TenantCurriculumMaterialFolder, TenantCurriculumQuestion, TenantSubjectCurriculumNode } from '../../models/tenant-subjects.models';
import { TenantSubjectDetailsFacade } from '../../state/tenant-subject-details.facade';

interface CurriculumPathItem {
  id: string;
  label: string;
}

interface CurriculumQuestionTreeRow {
  id: string;
  question: string;
  type: string;
  answerState: 'correct' | 'wrong' | null;
  description: string;
  mediaUrl: string | null;
  mediaName: string | null;
  mediaType: string | null;
  canDelete: boolean;
  children: CurriculumQuestionTreeRow[];
}

type CurriculumDetailsTab = 'questions' | 'material';

interface QuestionTextSegment {
  kind: 'text' | 'math';
  value: string;
}

interface MaterialFolderModalState {
  mode: 'create' | 'edit';
  folder: TenantCurriculumMaterialFolder | null;
  name: string;
  description: string;
}

interface MaterialFolderCoverSlot {
  kind: 'file' | 'more' | 'empty';
  type: string;
}

@Component({
  selector: 'app-tenant-subject-curriculum-details',
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-subject-curriculum-details.component.html',
  styleUrls: ['./tenant-subject-curriculum-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TenantSubjectCurriculumDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TenantSubjectDetailsFacade);
  private readonly data = inject(TenantSubjectsDataService);
  private readonly questionTypeSettings = inject(TenantQuestionTypeSettingsService);
  private readonly i18n = inject(I18nService);

  readonly subject = this.facade.subject;
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;
  readonly curriculumLoading = signal(false);
  readonly curriculumError = signal<string | null>(null);
  readonly questionsLoading = signal(false);
  readonly questionsError = signal<string | null>(null);
  readonly questionTypes = signal<TenantQuestionType[]>([]);
  readonly questionTypesLoading = signal(false);
  readonly questionTypeFilterOpen = signal(false);
  readonly questionSearch = signal('');
  readonly selectedQuestionTypeFilter = signal('');
  readonly questionPageIndex = signal(0);
  readonly questionPageSize = signal(10);
  readonly questionTotalElements = signal(0);
  readonly questionTotalPages = signal(1);
  readonly deletingQuestion = signal(false);
  readonly deleteQuestionError = signal<string | null>(null);
  readonly questionPendingDelete = signal<CurriculumQuestionTreeRow | null>(null);
  readonly previewImage = signal<CurriculumQuestionTreeRow | null>(null);
  readonly materialFolders = signal<TenantCurriculumMaterialFolder[]>([]);
  readonly materialLoading = signal(false);
  readonly materialError = signal<string | null>(null);
  readonly materialSaving = signal(false);
  readonly materialDeleteBusyId = signal<string | null>(null);
  readonly materialFolderPendingDelete = signal<TenantCurriculumMaterialFolder | null>(null);
  readonly materialFolderDeleteError = signal<string | null>(null);
  readonly materialFolderModal = signal<MaterialFolderModalState | null>(null);
  readonly materialFolderModalError = signal<string | null>(null);
  readonly selectedNodeId = signal<string | null>(null);
  readonly activeTab = signal<CurriculumDetailsTab>('questions');
  readonly expandedQuestionIds = signal(new Set<string>());
  readonly selectedQuestionRowId = signal<string | null>(null);
  readonly questionRows = signal<CurriculumQuestionTreeRow[]>([]);
  readonly curriculumRoot = signal<TenantSubjectCurriculumNode | null>(null);
  readonly subjectDetailsLink = computed(() => {
    const subject = this.subject();
    return subject ? [this.subjectsRootLink(), subject.id] : [this.subjectsRootLink()];
  });
  readonly curriculumLink = computed(() => {
    const subject = this.subject();
    return subject ? [this.subjectsRootLink(), subject.id, 'curriculum'] : [this.subjectsRootLink()];
  });
  readonly addQuestionLink = computed(() => {
    const subject = this.subject();
    const nodeId = this.selectedNodeId();
    return subject && nodeId ? [this.subjectsRootLink(), subject.id, 'curriculum', nodeId, 'addQuestion'] : this.curriculumLink();
  });
  readonly selectedNode = computed(() => {
    const root = this.curriculumRoot();
    const nodeId = this.selectedNodeId();
    return root && nodeId ? this.findNode([root], nodeId) : null;
  });
  readonly selectedPath = computed<CurriculumPathItem[]>(() => {
    const root = this.curriculumRoot();
    const nodeId = this.selectedNodeId();
    return root && nodeId ? this.findNodePath([root], nodeId) : [];
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.selectedNodeId.set(params.get('nodeId'));
        void this.loadSubjectAndCurriculum(params.get('id'));
      });
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params.get('tab') === 'material') {
          this.selectTab('material');
        }
      });
  }

  @HostListener('document:keydown.escape')
  closePreviewOnEscape(): void {
    this.closeImagePreview();
    this.questionTypeFilterOpen.set(false);
  }

  @HostListener('document:click')
  closeQuestionFilterOnOutsideClick(): void {
    this.questionTypeFilterOpen.set(false);
  }

  selectTab(tab: CurriculumDetailsTab): void {
    this.activeTab.set(tab);
    if (tab === 'material') {
      void this.reloadMaterialFolders();
    }
  }

  stopPanelClick(event: Event): void {
    event.stopPropagation();
  }

  tabLabel(tab: CurriculumDetailsTab): string {
    const labels = {
      questions: { en: 'Questions', ar: 'الأسئلة' },
      material: { en: 'Material', ar: 'الملحقات' },
    } as const;
    return labels[tab][this.i18n.language()];
  }

  isRtl(): boolean {
    return this.i18n.language() === 'ar';
  }

  pageDirection(): 'rtl' | 'ltr' {
    return this.isRtl() ? 'rtl' : 'ltr';
  }

  curriculumItemLabel(): string {
    return this.i18n.language() === 'ar' ? 'عناصر المنهج' : 'Curriculum Item';
  }

  questionSearchPlaceholder(): string {
    return this.i18n.language() === 'ar' ? 'بحث الاسئلة' : 'Search questions...';
  }

  advancedFiltersLabel(): string {
    return this.i18n.language() === 'ar' ? 'الفلتر' : 'Advanced Filters';
  }

  breadcrumbLabel(key: 'subject' | 'subjectDetails' | 'curriculum'): string {
    const labels = {
      subject: { en: 'Subject', ar: 'المادة' },
      subjectDetails: { en: 'Subject Details', ar: 'تفاصيل المادة' },
      curriculum: { en: 'Curriculum', ar: 'المنهج' },
    } as const;
    return labels[key][this.i18n.language()];
  }

  breadcrumbSeparatorIcon(): string {
    return this.i18n.language() === 'ar' ? 'chevron_left' : 'chevron_right';
  }

  subjectsListLink(): unknown[] {
    return [this.subjectsRootLink()];
  }

  materialFolderLink(folderId: string): unknown[] {
    const subject = this.subject();
    const nodeId = this.selectedNodeId();
    return subject && nodeId ? [this.subjectsRootLink(), subject.id, 'curriculum', nodeId, 'material', folderId] : this.curriculumLink();
  }

  editQuestionLink(questionId: string): unknown[] {
    const subject = this.subject();
    const nodeId = this.selectedNodeId();
    return subject && nodeId ? [this.subjectsRootLink(), subject.id, 'curriculum', nodeId, 'editQuestion', questionId] : this.curriculumLink();
  }

  breadcrumbPathLabel(item: CurriculumPathItem, first: boolean): string {
    const subject = this.subject();
    if (first && this.i18n.language() === 'ar') {
      return subject ? `منهج ${subject.name}` : 'منهج اسم المادة';
    }
    return item.label;
  }

  isQuestionExpanded(rowId: string): boolean {
    return this.expandedQuestionIds().has(rowId);
  }

  selectQuestionRow(rowId: string): void {
    this.selectedQuestionRowId.set(rowId);
  }

  isQuestionRowHighlighted(rowId: string): boolean {
    return this.selectedQuestionRowId() === rowId || this.isQuestionExpanded(rowId);
  }

  toggleQuestion(rowId: string): void {
    this.selectQuestionRow(rowId);
    const next = new Set(this.expandedQuestionIds());
    if (next.has(rowId)) {
      next.delete(rowId);
    } else {
      next.add(rowId);
    }
    this.expandedQuestionIds.set(next);
  }

  rowLabel(row: CurriculumQuestionTreeRow): string {
    return row.question || row.mediaName || 'Media item';
  }

  questionTextSegments(value: string): QuestionTextSegment[] {
    const segments: QuestionTextSegment[] = [];
    const pattern = /\\\((.+?)\\\)/g;
    let cursor = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(value)) !== null) {
      if (match.index > cursor) {
        segments.push({ kind: 'text', value: value.slice(cursor, match.index) });
      }
      segments.push({ kind: 'math', value: match[1] });
      cursor = match.index + match[0].length;
    }

    if (cursor < value.length) {
      segments.push({ kind: 'text', value: value.slice(cursor) });
    }

    return segments.length ? segments : [{ kind: 'text', value }];
  }

  tableHeaderLabel(key: 'question' | 'type' | 'description' | 'actions'): string {
    const labels = {
      question: { en: 'Question', ar: 'السؤال' },
      type: { en: 'Type', ar: 'النوع' },
      description: { en: 'Description', ar: 'الوصف' },
      actions: { en: 'Actions', ar: 'الاجرائات' },
    } as const;
    return labels[key][this.i18n.language()];
  }

  addQuestionLabel(): string {
    return this.i18n.language() === 'ar' ? 'اضافة سؤال' : 'Add Question';
  }

  createFolderLabel(): string {
    return this.i18n.language() === 'ar' ? 'إنشاء مجلد' : 'Create Folder';
  }

  folderModalTitle(modal: MaterialFolderModalState): string {
    if (this.i18n.language() === 'ar') {
      return modal.mode === 'edit' ? 'تعديل المجلد' : 'إنشاء مجلد';
    }
    return modal.mode === 'edit' ? 'Edit Folder' : 'Create Folder';
  }

  folderModalDescription(): string {
    return this.i18n.language() === 'ar'
      ? 'أضف اسم المجلد والوصف الاختياري.'
      : 'Add a name and optional description.';
  }

  folderNameLabel(): string {
    return this.i18n.language() === 'ar' ? 'الاسم' : 'Name';
  }

  folderDescriptionLabel(): string {
    return this.i18n.language() === 'ar' ? 'الوصف' : 'Description';
  }

  saveFolderLabel(): string {
    return this.i18n.language() === 'ar' ? 'حفظ المجلد' : 'Save Folder';
  }

  savingLabel(): string {
    return this.i18n.language() === 'ar' ? 'جاري الحفظ...' : 'Saving...';
  }

  materialEmptyTitle(): string {
    return this.i18n.language() === 'ar' ? 'لا توجد مجلدات مواد' : 'No material folders yet';
  }

  materialEmptyDescription(): string {
    return this.i18n.language() === 'ar'
      ? 'أنشئ مجلداً ثم ارفع ملفات PDF أو Word أو PowerPoint أو صوراً داخله.'
      : 'Create a folder, then upload PDFs, Word files, PowerPoint files, or images inside it.';
  }

  materialFolderFilesLabel(folder: TenantCurriculumMaterialFolder): string {
    if (this.i18n.language() === 'ar') {
      return `${folder.filesCount} ملف`;
    }
    return folder.filesCount === 1 ? '1 file' : `${folder.filesCount} files`;
  }

  materialFolderCountLabel(): string {
    const count = this.materialFolders().length;
    if (this.i18n.language() === 'ar') {
      return `${count} مجلد`;
    }
    return count === 1 ? '1 folder' : `${count} folders`;
  }

  deleteFolderTitle(): string {
    return this.i18n.language() === 'ar' ? 'حذف المجلد' : 'Delete folder';
  }

  deleteFolderMessage(folder: TenantCurriculumMaterialFolder): string {
    return this.i18n.language() === 'ar'
      ? `هل تريد حذف "${folder.name}"؟`
      : `Delete "${folder.name}"?`;
  }

  cancelLabel(): string {
    return this.i18n.language() === 'ar' ? 'إلغاء' : 'Cancel';
  }

  deleteLabel(): string {
    return this.i18n.language() === 'ar' ? 'حذف' : 'Delete';
  }

  materialFolderIcon(type: string): string {
    const icons: Record<string, string> = {
      pdf: 'picture_as_pdf',
      word: 'description',
      powerpoint: 'slideshow',
      image: 'image',
      video: 'movie',
      note: 'edit_note',
      link: 'link',
      file: 'insert_drive_file',
    };
    return icons[type] ?? 'insert_drive_file';
  }

  materialFolderCoverSlots(folder: TenantCurriculumMaterialFolder): MaterialFolderCoverSlot[] {
    const types = folder.fileTypes.length ? folder.fileTypes : ['file'];
    const fileCount = Math.max(folder.filesCount, folder.fileTypes.length);
    const visibleFileSlots = Math.min(fileCount, 3);
    const slots: MaterialFolderCoverSlot[] = [];

    for (let index = 0; index < visibleFileSlots; index += 1) {
      slots.push({ kind: 'file', type: types[index % types.length] ?? 'file' });
    }

    if (fileCount > 3) {
      slots.push({ kind: 'more', type: 'more' });
    }

    while (slots.length < 4) {
      slots.push({ kind: 'empty', type: 'empty' });
    }

    return slots;
  }

  openCreateFolderModal(): void {
    this.materialFolderModalError.set(null);
    this.materialFolderModal.set({ mode: 'create', folder: null, name: '', description: '' });
  }

  openEditFolderModal(folder: TenantCurriculumMaterialFolder): void {
    this.materialFolderModalError.set(null);
    this.materialFolderModal.set({
      mode: 'edit',
      folder,
      name: folder.name,
      description: folder.description ?? '',
    });
  }

  closeFolderModal(): void {
    if (this.materialSaving()) {
      return;
    }
    this.materialFolderModal.set(null);
    this.materialFolderModalError.set(null);
  }

  updateFolderModalName(event: Event): void {
    const value = event.target instanceof HTMLInputElement ? event.target.value : '';
    this.materialFolderModal.update((modal) => modal ? { ...modal, name: value } : modal);
  }

  updateFolderModalDescription(event: Event): void {
    const value = event.target instanceof HTMLTextAreaElement ? event.target.value : '';
    this.materialFolderModal.update((modal) => modal ? { ...modal, description: value } : modal);
  }

  async saveFolderModal(): Promise<void> {
    const subject = this.subject();
    const nodeId = this.selectedNodeId();
    const modal = this.materialFolderModal();
    if (!subject || !nodeId || !modal || this.materialSaving()) {
      return;
    }

    if (!modal.name.trim()) {
      this.materialFolderModalError.set(this.i18n.language() === 'ar' ? 'اسم المجلد مطلوب.' : 'Folder name is required.');
      return;
    }

    this.materialSaving.set(true);
    this.materialFolderModalError.set(null);
    try {
      if (modal.mode === 'edit' && modal.folder) {
        await this.data.updateCurriculumMaterialFolder(subject.id, nodeId, modal.folder.id, {
          name: modal.name,
          description: modal.description,
        });
      } else {
        await this.data.createCurriculumMaterialFolder(subject.id, nodeId, {
          name: modal.name,
          description: modal.description,
        });
      }
      this.materialFolderModal.set(null);
      await this.reloadMaterialFolders();
    } catch (error) {
      this.materialFolderModalError.set(this.data.toUserMessage(error, 'Unable to save material folder. Please try again.'));
    } finally {
      this.materialSaving.set(false);
    }
  }

  confirmDeleteMaterialFolder(folder: TenantCurriculumMaterialFolder): void {
    this.materialFolderDeleteError.set(null);
    this.materialFolderPendingDelete.set(folder);
  }

  closeDeleteMaterialFolderModal(): void {
    if (this.materialDeleteBusyId()) {
      return;
    }
    this.materialFolderPendingDelete.set(null);
    this.materialFolderDeleteError.set(null);
  }

  async deleteMaterialFolder(): Promise<void> {
    const subject = this.subject();
    const nodeId = this.selectedNodeId();
    const folder = this.materialFolderPendingDelete();
    if (!subject || !nodeId || !folder || this.materialDeleteBusyId()) {
      return;
    }

    this.materialDeleteBusyId.set(folder.id);
    this.materialError.set(null);
    this.materialFolderDeleteError.set(null);
    try {
      await this.data.deleteCurriculumMaterialFolder(subject.id, nodeId, folder.id);
      this.materialFolderPendingDelete.set(null);
      await this.reloadMaterialFolders();
    } catch (error) {
      this.materialFolderDeleteError.set(this.data.toUserMessage(error, 'Unable to delete material folder. Please try again.'));
    } finally {
      this.materialDeleteBusyId.set(null);
    }
  }

  selectedQuestionTypeFilterLabel(): string {
    const selected = this.questionTypes().find((type) => type.code === this.selectedQuestionTypeFilter());
    return selected?.name ?? this.allQuestionTypesLabel();
  }

  allQuestionTypesLabel(): string {
    return this.i18n.language() === 'ar' ? 'كل الأنواع' : 'All types';
  }

  questionRangeLabel(): string {
    const total = this.questionTotalElements();
    if (!total) {
      return this.i18n.language() === 'ar' ? 'لا توجد أسئلة' : 'No questions';
    }
    const start = this.questionPageIndex() * this.questionPageSize() + 1;
    const end = Math.min(total, start + this.questionRows().length - 1);
    return this.i18n.language() === 'ar'
      ? `عرض ${start}-${end} من ${total} سؤال`
      : `Showing ${start}-${end} of ${total} questions`;
  }

  questionPageLabel(): string {
    return this.i18n.language() === 'ar'
      ? `صفحة ${this.questionPageIndex() + 1} من ${this.questionTotalPages()}`
      : `Page ${this.questionPageIndex() + 1} of ${this.questionTotalPages()}`;
  }

  updateQuestionSearch(event: Event): void {
    const value = event.target instanceof HTMLInputElement ? event.target.value : '';
    this.questionSearch.set(value);
    void this.reloadQuestionsFromFirstPage();
  }

  toggleQuestionTypeFilter(event: Event): void {
    event.stopPropagation();
    this.questionTypeFilterOpen.update((open) => !open);
  }

  selectQuestionTypeFilter(type: string): void {
    this.selectedQuestionTypeFilter.set(type);
    this.questionTypeFilterOpen.set(false);
    void this.reloadQuestionsFromFirstPage();
  }

  clearQuestionFilters(): void {
    this.questionSearch.set('');
    this.selectedQuestionTypeFilter.set('');
    this.questionTypeFilterOpen.set(false);
    void this.reloadQuestionsFromFirstPage();
  }

  setQuestionPageSize(value: string | number): void {
    const parsed = Number(value);
    this.questionPageSize.set(Number.isFinite(parsed) && parsed > 0 ? parsed : 10);
    void this.reloadQuestionsFromFirstPage();
  }

  previousQuestionPage(): void {
    if (this.questionPageIndex() <= 0) {
      return;
    }
    this.questionPageIndex.update((page) => page - 1);
    void this.reloadQuestions();
  }

  nextQuestionPage(): void {
    if (this.questionPageIndex() >= this.questionTotalPages() - 1) {
      return;
    }
    this.questionPageIndex.update((page) => page + 1);
    void this.reloadQuestions();
  }

  questionTypeLabel(type: string): string {
    const labels: Record<string, { en: string; ar: string }> = {
      MULTIPLE_CHOICE: { en: 'Multiple Choice', ar: 'اختيار من متعدد' },
      TRUE_FALSE: { en: 'True False', ar: 'صح و خطأ' },
      SHORT_ANSWER: { en: 'Short Answer', ar: 'اجابه قصيرة' },
      ESSAY: { en: 'Essay', ar: 'مقال' },
      MCQ: { en: 'MCQ', ar: 'اختيار اجابة واحدة' },
    };
    const label = labels[type];
    if (label) {
      return label[this.i18n.language()];
    }
    return type
      .toLowerCase()
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  treeToggleIcon(row: CurriculumQuestionTreeRow): string {
    if (this.isQuestionExpanded(row.id)) {
      return 'expand_more';
    }
    return this.i18n.language() === 'ar' ? 'chevron_left' : 'chevron_right';
  }

  confirmDeleteQuestion(row: CurriculumQuestionTreeRow): void {
    if (!row.canDelete || this.deletingQuestion()) {
      return;
    }
    this.deleteQuestionError.set(null);
    this.questionPendingDelete.set(row);
  }

  isImageMedia(row: CurriculumQuestionTreeRow): boolean {
    if (!row.mediaUrl) {
      return false;
    }

    const mediaType = row.mediaType?.toLowerCase() ?? '';
    const mediaName = row.mediaName?.toLowerCase() ?? row.mediaUrl.toLowerCase();
    return mediaType.startsWith('image/') || /\.(avif|gif|jpe?g|png|svg|webp)(\?|#|$)/i.test(mediaName);
  }

  openImagePreview(row: CurriculumQuestionTreeRow): void {
    if (!this.isImageMedia(row)) {
      return;
    }
    this.previewImage.set(row);
  }

  closeImagePreview(): void {
    this.previewImage.set(null);
  }

  closeDeleteQuestionModal(): void {
    if (this.deletingQuestion()) {
      return;
    }
    this.questionPendingDelete.set(null);
    this.deleteQuestionError.set(null);
  }

  async deleteQuestion(): Promise<void> {
    const subject = this.subject();
    const nodeId = this.selectedNodeId();
    const row = this.questionPendingDelete();
    if (!subject || !nodeId || !row || this.deletingQuestion()) {
      return;
    }

    this.deletingQuestion.set(true);
    this.deleteQuestionError.set(null);
    try {
      await this.data.deleteCurriculumQuestion(subject.id, nodeId, row.id);
      const expanded = new Set(this.expandedQuestionIds());
      expanded.delete(row.id);
      this.expandedQuestionIds.set(expanded);
      this.questionPendingDelete.set(null);
      await this.reloadQuestions();
    } catch (error) {
      this.deleteQuestionError.set(this.data.toUserMessage(error, 'Question cannot be deleted while it is used, assigned, or linked to another record.'));
    } finally {
      this.deletingQuestion.set(false);
    }
  }

  private async loadSubjectAndCurriculum(subjectId: string | null): Promise<void> {
    this.curriculumRoot.set(null);
    this.questionRows.set([]);
    await this.facade.loadSubject(subjectId);
    const subject = this.subject();
    if (subject) {
      await this.loadCurriculum(subject.id);
      void this.loadQuestionTypes();
      const nodeId = this.selectedNodeId();
      if (nodeId) {
        await this.loadQuestions(subject.id, nodeId);
        await this.loadMaterialFolders(subject.id, nodeId);
      }
    }
  }

  private async reloadQuestionsFromFirstPage(): Promise<void> {
    this.questionPageIndex.set(0);
    await this.reloadQuestions();
  }

  private async reloadQuestions(): Promise<void> {
    const subject = this.subject();
    const nodeId = this.selectedNodeId();
    if (!subject || !nodeId) {
      return;
    }
    await this.loadQuestions(subject.id, nodeId);
  }

  private async reloadMaterialFolders(): Promise<void> {
    const subject = this.subject();
    const nodeId = this.selectedNodeId();
    if (!subject || !nodeId) {
      return;
    }
    await this.loadMaterialFolders(subject.id, nodeId);
  }

  private async loadQuestionTypes(): Promise<void> {
    this.questionTypesLoading.set(true);
    try {
      this.questionTypes.set(await this.questionTypeSettings.listQuestionTypes());
    } catch {
      this.questionTypes.set([]);
    } finally {
      this.questionTypesLoading.set(false);
    }
  }

  private async loadCurriculum(subjectId: string): Promise<void> {
    this.curriculumLoading.set(true);
    this.curriculumError.set(null);
    try {
      this.curriculumRoot.set(await this.data.getSubjectCurriculum(subjectId));
    } catch (error) {
      this.curriculumError.set(this.data.toUserMessage(error, 'Unable to load curriculum details. Please try again.'));
    } finally {
      this.curriculumLoading.set(false);
    }
  }

  private async loadQuestions(subjectId: string, nodeId: string): Promise<void> {
    this.questionsLoading.set(true);
    this.questionsError.set(null);
    try {
      const page = await this.data.listCurriculumQuestionsPage(subjectId, nodeId, {
        search: this.questionSearch(),
        type: this.selectedQuestionTypeFilter(),
        page: this.questionPageIndex(),
        size: this.questionPageSize(),
      });
      this.questionRows.set(page.content.map((question) => this.toQuestionRow(question)));
      this.questionTotalElements.set(page.totalElements);
      this.questionTotalPages.set(Math.max(1, page.totalPages));
      const safePageIndex = Math.min(page.page, Math.max(0, page.totalPages - 1));
      if (page.content.length === 0 && page.totalElements > 0 && page.page > safePageIndex) {
        this.questionPageIndex.set(safePageIndex);
        await this.loadQuestions(subjectId, nodeId);
        return;
      }
      this.questionPageIndex.set(safePageIndex);
    } catch (error) {
      this.questionsError.set(this.data.toUserMessage(error, 'Unable to load questions. Please try again.'));
    } finally {
      this.questionsLoading.set(false);
    }
  }

  private async loadMaterialFolders(subjectId: string, nodeId: string): Promise<void> {
    this.materialLoading.set(true);
    this.materialError.set(null);
    try {
      const folders = await this.data.listCurriculumMaterialFolders(subjectId, nodeId);
      this.materialFolders.set(await Promise.all(folders.map((folder) => this.withCurrentMaterialFolderCounts(subjectId, nodeId, folder))));
    } catch (error) {
      this.materialError.set(this.data.toUserMessage(error, 'Unable to load material folders. Please try again.'));
    } finally {
      this.materialLoading.set(false);
    }
  }

  private async withCurrentMaterialFolderCounts(
    subjectId: string,
    nodeId: string,
    folder: TenantCurriculumMaterialFolder,
  ): Promise<TenantCurriculumMaterialFolder> {
    try {
      const [files, notes, links] = await Promise.all([
        this.data.listCurriculumMaterialFiles(subjectId, nodeId, folder.id),
        this.data.listCurriculumMaterialNotes(subjectId, nodeId, folder.id),
        this.data.listCurriculumMaterialLinks(subjectId, nodeId, folder.id),
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
    if (contentType.startsWith('video/') || /\.(m4v|mov|mp4|mpeg|webm)$/.test(name)) {
      return 'video';
    }
    return 'file';
  }

  private toQuestionRow(question: TenantCurriculumQuestion): CurriculumQuestionTreeRow {
    return {
      id: question.id,
      question: question.question || (this.isImageQuestion(question) ? '' : question.mediaOriginalName || question.mediaFileName || 'Media question'),
      type: question.type,
      answerState: null,
      description: question.description || question.answer || '',
      mediaUrl: this.data.mediaUrlToAbsolute(question.mediaUrl),
      mediaName: question.mediaOriginalName || question.mediaFileName,
      mediaType: question.mediaContentType,
      canDelete: true,
      children: question.answers.map((answer) => ({
        id: answer.id,
        question: answer.answer || (this.isImageAnswer(answer) ? '' : answer.mediaOriginalName || answer.mediaFileName || 'Media answer'),
        type: answer.correct ? 'Correct answer' : 'Wrong answer',
        answerState: answer.correct ? 'correct' : 'wrong',
        description: answer.description ?? '',
        mediaUrl: this.data.mediaUrlToAbsolute(answer.mediaUrl),
        mediaName: answer.mediaOriginalName || answer.mediaFileName || null,
        mediaType: answer.mediaContentType || null,
        canDelete: false,
        children: [],
      })),
    };
  }

  private isImageQuestion(question: TenantCurriculumQuestion): boolean {
    return this.isImageMediaType(question.mediaContentType, question.mediaOriginalName || question.mediaFileName || question.mediaUrl);
  }

  private isImageAnswer(answer: TenantCurriculumQuestion['answers'][number]): boolean {
    return this.isImageMediaType(answer.mediaContentType ?? null, answer.mediaOriginalName || answer.mediaFileName || answer.mediaUrl || null);
  }

  private isImageMediaType(mediaType: string | null | undefined, mediaNameOrUrl: string | null | undefined): boolean {
    const type = mediaType?.toLowerCase() ?? '';
    const nameOrUrl = mediaNameOrUrl?.toLowerCase() ?? '';
    return type.startsWith('image/') || /\.(avif|gif|jpe?g|png|svg|webp)(\?|#|$)/i.test(nameOrUrl);
  }

  private findNode(nodes: TenantSubjectCurriculumNode[], nodeId: string): TenantSubjectCurriculumNode | null {
    for (const node of nodes) {
      if (node.id === nodeId) {
        return node;
      }

      const child = node.children.length ? this.findNode(node.children, nodeId) : null;
      if (child) {
        return child;
      }
    }

    return null;
  }

  private findNodePath(
    nodes: TenantSubjectCurriculumNode[],
    nodeId: string,
    parents: CurriculumPathItem[] = [],
  ): CurriculumPathItem[] {
    for (const node of nodes) {
      const path = [...parents, { id: node.id, label: node.label }];
      if (node.id === nodeId) {
        return path;
      }

      const childPath = node.children.length ? this.findNodePath(node.children, nodeId, path) : [];
      if (childPath.length) {
        return childPath;
      }
    }

    return [];
  }

  private subjectsRootLink(): string {
    return this.router.url.startsWith('/tenant/university-subjects') ? '/tenant/university-subjects' : '/tenant/subjects';
  }
}
