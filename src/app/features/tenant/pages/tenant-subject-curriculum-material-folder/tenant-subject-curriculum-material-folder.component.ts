import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import type EditorJS from '@editorjs/editorjs';
import type { OutputData } from '@editorjs/editorjs';
import { I18nService } from '../../../../core/services/i18n.service';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantCurriculumMaterialFile, TenantCurriculumMaterialFolder, TenantCurriculumMaterialLink, TenantCurriculumMaterialNote, TenantSubjectCurriculumNode } from '../../models/tenant-subjects.models';
import { TenantSubjectDetailsFacade } from '../../state/tenant-subject-details.facade';

interface CurriculumPathItem {
  id: string;
  label: string;
}

type MaterialContentFilter = 'all' | 'notes' | 'links' | 'files';

type PresentationPreviewer = {
  preview(file: ArrayBuffer): Promise<unknown>;
  destroy(): void;
};

@Component({
  selector: 'app-tenant-subject-curriculum-material-folder',
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-subject-curriculum-material-folder.component.html',
  styleUrls: ['./tenant-subject-curriculum-material-folder.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantSubjectCurriculumMaterialFolderComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TenantSubjectDetailsFacade);
  private readonly data = inject(TenantSubjectsDataService);
  private readonly i18n = inject(I18nService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly http = inject(HttpClient);
  private pdfPreviewObjectUrl: string | null = null;
  private presentationPreviewer: PresentationPreviewer | null = null;
  private editor: EditorJS | null = null;

  @ViewChild('presentationPreviewHost')
  private presentationPreviewHost?: ElementRef<HTMLElement>;

  @ViewChild('noteEditorHost')
  private noteEditorHost?: ElementRef<HTMLElement>;

  readonly subject = this.facade.subject;
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;
  readonly curriculumRoot = signal<TenantSubjectCurriculumNode | null>(null);
  readonly folder = signal<TenantCurriculumMaterialFolder | null>(null);
  readonly files = signal<TenantCurriculumMaterialFile[]>([]);
  readonly notes = signal<TenantCurriculumMaterialNote[]>([]);
  readonly links = signal<TenantCurriculumMaterialLink[]>([]);
  readonly nodeId = signal<string | null>(null);
  readonly folderId = signal<string | null>(null);
  readonly loadingFolder = signal(false);
  readonly folderError = signal<string | null>(null);
  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly uploadLoaded = signal(0);
  readonly uploadTotal = signal(0);
  readonly uploadFileName = signal('');
  readonly deletingFileId = signal<string | null>(null);
  readonly filePendingDelete = signal<TenantCurriculumMaterialFile | null>(null);
  readonly deleteFileError = signal<string | null>(null);
  readonly previewFile = signal<TenantCurriculumMaterialFile | null>(null);
  readonly previewPdfUrl = signal<SafeResourceUrl | null>(null);
  readonly previewPdfLoading = signal(false);
  readonly previewPdfError = signal<string | null>(null);
  readonly previewPresentationLoading = signal(false);
  readonly previewPresentationError = signal<string | null>(null);
  readonly activeNote = signal<TenantCurriculumMaterialNote | null>(null);
  readonly noteEditorOpen = signal(false);
  readonly noteSaving = signal(false);
  readonly noteError = signal<string | null>(null);
  readonly notePendingDelete = signal<TenantCurriculumMaterialNote | null>(null);
  readonly deletingNoteId = signal<string | null>(null);
  readonly deleteNoteError = signal<string | null>(null);
  readonly linkModalOpen = signal(false);
  readonly linkTitle = signal('');
  readonly linkUrl = signal('');
  readonly linkSaving = signal(false);
  readonly linkError = signal<string | null>(null);
  readonly previewLink = signal<TenantCurriculumMaterialLink | null>(null);
  readonly deletingLinkId = signal<string | null>(null);
  readonly contentSearch = signal('');
  readonly contentFilter = signal<MaterialContentFilter>('all');
  readonly contentFilterOpen = signal(false);

  readonly subjectDetailsLink = computed(() => {
    const subject = this.subject();
    return subject ? [this.subjectsRootLink(), subject.id] : [this.subjectsRootLink()];
  });

  readonly curriculumLink = computed(() => {
    const subject = this.subject();
    return subject ? [this.subjectsRootLink(), subject.id, 'curriculum'] : [this.subjectsRootLink()];
  });

  readonly nodeDetailsLink = computed(() => {
    const subject = this.subject();
    const nodeId = this.nodeId();
    return subject && nodeId ? [this.subjectsRootLink(), subject.id, 'curriculum', nodeId] : this.curriculumLink();
  });

  readonly selectedPath = computed<CurriculumPathItem[]>(() => {
    const root = this.curriculumRoot();
    const nodeId = this.nodeId();
    return root && nodeId ? this.findNodePath([root], nodeId) : [];
  });

  readonly filteredNotes = computed(() => {
    if (this.contentFilter() !== 'all' && this.contentFilter() !== 'notes') {
      return [];
    }
    const term = this.normalizedContentSearch();
    return this.notes().filter((note) => !term || `${note.title} ${this.notePreview(note)}`.toLowerCase().includes(term));
  });

  readonly filteredLinks = computed(() => {
    if (this.contentFilter() !== 'all' && this.contentFilter() !== 'links') {
      return [];
    }
    const term = this.normalizedContentSearch();
    return this.links().filter((link) => !term || `${link.title} ${link.url} ${this.linkHostLabel(link)}`.toLowerCase().includes(term));
  });

  readonly filteredFiles = computed(() => {
    if (this.contentFilter() !== 'all' && this.contentFilter() !== 'files') {
      return [];
    }
    const term = this.normalizedContentSearch();
    return this.files().filter((file) => !term || `${file.originalName} ${file.contentType ?? ''}`.toLowerCase().includes(term));
  });

  subjectsListLink(): unknown[] {
    return [this.subjectsRootLink()];
  }

  addNoteLink(): unknown[] {
    const subject = this.subject();
    const nodeId = this.nodeId();
    const folderId = this.folderId();
    return subject && nodeId && folderId ? [this.subjectsRootLink(), subject.id, 'curriculum', nodeId, 'material', folderId, 'addNote'] : this.nodeDetailsLink();
  }

  noteLink(noteId: string): unknown[] {
    const subject = this.subject();
    const nodeId = this.nodeId();
    const folderId = this.folderId();
    return subject && nodeId && folderId ? [this.subjectsRootLink(), subject.id, 'curriculum', nodeId, 'material', folderId, 'notes', noteId] : this.nodeDetailsLink();
  }

  readonly hasVisibleContent = computed(() => {
    return this.uploading() || this.filteredNotes().length > 0 || this.filteredLinks().length > 0 || this.filteredFiles().length > 0;
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.nodeId.set(params.get('nodeId'));
        this.folderId.set(params.get('folderId'));
        void this.load(params.get('id'));
      });
  }

  ngOnDestroy(): void {
    this.revokePdfPreviewUrl();
    this.destroyEditor();
  }

  @HostListener('document:keydown.escape')
  closePreviewOnEscape(): void {
    this.closeFilePreview();
    this.contentFilterOpen.set(false);
  }

  @HostListener('document:click')
  closeOpenPanels(): void {
    this.contentFilterOpen.set(false);
  }

  breadcrumbLabel(key: 'subject' | 'subjectDetails' | 'curriculum' | 'material'): string {
    const labels = {
      subject: { en: 'Subject', ar: 'المادة' },
      subjectDetails: { en: 'Subject Details', ar: 'تفاصيل المادة' },
      curriculum: { en: 'Curriculum', ar: 'المنهج' },
      material: { en: 'Material', ar: 'الملحقات' },
    } as const;
    return labels[key][this.i18n.language()];
  }

  breadcrumbSeparatorIcon(): string {
    return this.i18n.language() === 'ar' ? 'chevron_left' : 'chevron_right';
  }

  breadcrumbPathLabel(item: CurriculumPathItem, first: boolean): string {
    const subject = this.subject();
    if (first && this.i18n.language() === 'ar') {
      return subject ? `منهج ${subject.name}` : 'منهج اسم المادة';
    }
    return item.label;
  }

  pageDirection(): 'ltr' | 'rtl' {
    return this.i18n.language() === 'ar' ? 'rtl' : 'ltr';
  }

  uploadLabel(): string {
    return this.i18n.language() === 'ar' ? 'رفع ملف' : 'Upload File';
  }

  addNoteLabel(): string {
    return this.i18n.language() === 'ar' ? 'إضافة ملاحظة' : 'Add Note';
  }

  addExternalLinkLabel(): string {
    return this.i18n.language() === 'ar' ? 'إضافة رابط خارجي' : 'Add External Link';
  }

  quickActionsLabel(): string {
    return this.i18n.language() === 'ar' ? 'إجراءات سريعة' : 'Quick Actions';
  }

  searchPlaceholder(): string {
    return this.i18n.language() === 'ar' ? 'بحث في الملحقات' : 'Search material';
  }

  filterLabel(): string {
    return this.i18n.language() === 'ar' ? 'الفلتر' : 'Advanced Filters';
  }

  filterByLabel(): string {
    return this.i18n.language() === 'ar' ? 'نوع المحتوى' : 'Content Type';
  }

  resetLabel(): string {
    return this.i18n.language() === 'ar' ? 'إعادة ضبط' : 'Reset';
  }

  clearLabel(): string {
    return this.i18n.language() === 'ar' ? 'مسح' : 'Clear';
  }

  contentFilterLabel(filter: MaterialContentFilter): string {
    const labels = {
      all: { en: 'All content', ar: 'كل المحتوى' },
      notes: { en: 'Notes', ar: 'الملاحظات' },
      links: { en: 'External Links', ar: 'الروابط الخارجية' },
      files: { en: 'Files', ar: 'الملفات' },
    } as const;
    return labels[filter][this.i18n.language()];
  }

  materialCountLabel(): string {
    const total = this.notes().length + this.links().length + this.files().length;
    if (this.i18n.language() === 'ar') {
      return `${total} عنصر`;
    }
    return `${total} ${total === 1 ? 'item' : 'items'}`;
  }

  visibleMaterialCountLabel(): string {
    const total = this.filteredNotes().length + this.filteredLinks().length + this.filteredFiles().length;
    if (this.i18n.language() === 'ar') {
      return `${total} نتيجة`;
    }
    return `${total} ${total === 1 ? 'result' : 'results'}`;
  }

  linkLabel(): string {
    return this.i18n.language() === 'ar' ? 'رابط خارجي' : 'External Link';
  }

  linkTitleLabel(): string {
    return this.i18n.language() === 'ar' ? 'العنوان' : 'Title';
  }

  linkUrlLabel(): string {
    return this.i18n.language() === 'ar' ? 'الرابط' : 'Link';
  }

  saveLabel(): string {
    return this.i18n.language() === 'ar' ? 'حفظ' : 'Save';
  }

  saveNoteLabel(): string {
    return this.i18n.language() === 'ar' ? 'حفظ الملاحظة' : 'Save Note';
  }

  noteLabel(): string {
    return this.i18n.language() === 'ar' ? 'ملاحظة' : 'Note';
  }

  linkHostLabel(link: TenantCurriculumMaterialLink): string {
    try {
      return new URL(this.normalizedExternalUrl(link.url)).hostname.replace(/^www\./, '');
    } catch {
      return link.url;
    }
  }

  uploadingLabel(): string {
    return this.i18n.language() === 'ar' ? 'جاري الرفع' : 'Uploading';
  }

  previewLoadingLabel(): string {
    return this.i18n.language() === 'ar' ? 'جاري عرض الملف' : 'Loading preview';
  }

  emptyFilesLabel(): string {
    if (this.contentSearch() || this.contentFilter() !== 'all') {
      return this.i18n.language() === 'ar' ? 'لا توجد نتائج مطابقة.' : 'No matching material found.';
    }
    return this.i18n.language() === 'ar' ? 'لا توجد ملفات داخل هذا المجلد.' : 'No files have been uploaded to this folder yet.';
  }

  deleteLabel(): string {
    return this.i18n.language() === 'ar' ? 'حذف' : 'Delete';
  }

  cancelLabel(): string {
    return this.i18n.language() === 'ar' ? 'إلغاء' : 'Cancel';
  }

  deleteFileTitle(): string {
    return this.i18n.language() === 'ar' ? 'حذف الملف' : 'Delete file';
  }

  deleteFileMessage(file: TenantCurriculumMaterialFile): string {
    return this.i18n.language() === 'ar'
      ? `هل تريد حذف "${file.originalName}"؟`
      : `Delete "${file.originalName}"?`;
  }

  deleteNoteTitle(): string {
    return this.i18n.language() === 'ar' ? 'حذف الملاحظة' : 'Delete note';
  }

  deleteNoteMessage(note: TenantCurriculumMaterialNote): string {
    return this.i18n.language() === 'ar'
      ? `هل تريد حذف "${note.title}"؟`
      : `Delete "${note.title}"?`;
  }

  openLinkModal(): void {
    this.linkTitle.set('');
    this.linkUrl.set('');
    this.linkError.set(null);
    this.linkModalOpen.set(true);
  }

  closeLinkModal(): void {
    if (this.linkSaving()) {
      return;
    }
    this.linkModalOpen.set(false);
    this.linkError.set(null);
  }

  updateLinkTitle(value: string): void {
    this.linkTitle.set(value);
  }

  updateLinkUrl(value: string): void {
    this.linkUrl.set(value);
  }

  updateContentSearch(event: Event): void {
    const input = event.target instanceof HTMLInputElement ? event.target : null;
    this.contentSearch.set(input?.value ?? '');
  }

  toggleContentFilter(event: Event): void {
    event.stopPropagation();
    this.contentFilterOpen.update((open) => !open);
  }

  selectContentFilter(filter: MaterialContentFilter): void {
    this.contentFilter.set(filter);
    this.contentFilterOpen.set(false);
  }

  clearContentFilters(): void {
    this.contentSearch.set('');
    this.contentFilter.set('all');
    this.contentFilterOpen.set(false);
  }

  stopPanelClick(event: Event): void {
    event.stopPropagation();
  }

  async saveExternalLink(): Promise<void> {
    const subject = this.subject();
    const nodeId = this.nodeId();
    const folderId = this.folderId();
    const title = this.linkTitle().trim();
    const url = this.linkUrl().trim();
    if (!subject || !nodeId || !folderId || this.linkSaving()) {
      return;
    }
    if (!title || !url) {
      this.linkError.set(this.i18n.language() === 'ar' ? 'اكتب العنوان والرابط.' : 'Enter the title and link.');
      return;
    }

    this.linkSaving.set(true);
    this.linkError.set(null);
    try {
      await this.data.createCurriculumMaterialLink(subject.id, nodeId, folderId, {
        title,
        url: this.normalizedExternalUrl(url),
      });
      this.linkModalOpen.set(false);
      await this.reloadFiles();
    } catch (error) {
      this.linkError.set(this.data.toUserMessage(error, 'Unable to save external link. Please try again.'));
    } finally {
      this.linkSaving.set(false);
    }
  }

  uploadProgressPercent(): number {
    const total = this.uploadTotal();
    if (!total) {
      return 0;
    }
    return Math.min(100, Math.round((this.uploadLoaded() / total) * 100));
  }

  uploadProgressLabel(): string {
    return `${this.formatBytes(this.uploadLoaded())} / ${this.formatBytes(this.uploadTotal())}`;
  }

  uploadUploadedLabel(): string {
    const label = this.i18n.language() === 'ar' ? 'تم رفعه' : 'Uploaded';
    return `${label}: ${this.formatBytes(this.uploadLoaded())}`;
  }

  uploadRemainingLabel(): string {
    const remaining = Math.max(this.uploadTotal() - this.uploadLoaded(), 0);
    const label = this.i18n.language() === 'ar' ? 'المتبقي' : 'Remaining';
    return `${label}: ${this.formatBytes(remaining)}`;
  }

  notePreview(note: TenantCurriculumMaterialNote): string {
    const data = this.parseNoteContent(note.contentJson);
    const block = data?.blocks.find((item) => {
      const text = this.noteBlockText(item);
      return text.length > 0;
    });
    return block ? this.noteBlockText(block) : (this.i18n.language() === 'ar' ? 'لا يوجد نص داخل الملاحظة بعد.' : 'No text in this note yet.');
  }

  fileIcon(file: TenantCurriculumMaterialFile): string {
    const type = file.contentType?.toLowerCase() ?? '';
    const name = file.originalName.toLowerCase();
    if (type.includes('pdf') || name.endsWith('.pdf')) return 'picture_as_pdf';
    if (type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return 'description';
    if (type.includes('powerpoint') || type.includes('presentation') || name.endsWith('.ppt') || name.endsWith('.pptx')) return 'slideshow';
    if (type.startsWith('image/') || /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(name)) return 'image';
    if (type.startsWith('video/') || /\.(m4v|mov|mp4|mpeg|mpg|ogg|ogv|webm)$/i.test(name)) return 'movie';
    return 'insert_drive_file';
  }

  isImageFile(file: TenantCurriculumMaterialFile): boolean {
    const type = file.contentType?.toLowerCase() ?? '';
    const name = file.originalName.toLowerCase();
    return type.startsWith('image/') || /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(name);
  }

  isPdfFile(file: TenantCurriculumMaterialFile): boolean {
    const type = file.contentType?.toLowerCase() ?? '';
    return type.includes('pdf') || file.originalName.toLowerCase().endsWith('.pdf');
  }

  isPresentationFile(file: TenantCurriculumMaterialFile): boolean {
    const type = file.contentType?.toLowerCase() ?? '';
    const name = file.originalName.toLowerCase();
    return type.includes('presentation') || name.endsWith('.pptx');
  }

  isVideoFile(file: TenantCurriculumMaterialFile): boolean {
    const type = file.contentType?.toLowerCase() ?? '';
    const name = file.originalName.toLowerCase();
    return type.startsWith('video/') || /\.(m4v|mov|mp4|mpeg|mpg|ogg|ogv|webm)$/i.test(name);
  }

  openFilePreview(file: TenantCurriculumMaterialFile): void {
    this.previewLink.set(null);
    this.revokePdfPreviewUrl();
    this.destroyPresentationPreviewer();
    this.previewPdfError.set(null);
    this.previewPresentationError.set(null);
    this.previewFile.set(file);
    if (this.isPdfFile(file)) {
      void this.preparePdfPreview(file);
    } else if (this.isPresentationFile(file)) {
      void this.preparePresentationPreview(file);
    }
  }

  closeFilePreview(): void {
    this.previewFile.set(null);
    this.previewLink.set(null);
    this.previewPdfLoading.set(false);
    this.previewPdfError.set(null);
    this.previewPresentationLoading.set(false);
    this.previewPresentationError.set(null);
    this.revokePdfPreviewUrl();
    this.destroyPresentationPreviewer();
  }

  openLinkPreview(link: TenantCurriculumMaterialLink): void {
    this.closeFilePreview();
    this.previewLink.set(link);
  }

  externalPreviewUrl(link: TenantCurriculumMaterialLink): SafeResourceUrl {
    const youtube = this.youtubeEmbedUrl(link.url);
    return this.sanitizer.bypassSecurityTrustResourceUrl(youtube ?? this.normalizedExternalUrl(link.url));
  }

  isYoutubeLink(link: TenantCurriculumMaterialLink): boolean {
    return this.youtubeEmbedUrl(link.url) !== null;
  }

  async deleteLink(link: TenantCurriculumMaterialLink, event: Event): Promise<void> {
    event.stopPropagation();
    const subject = this.subject();
    const nodeId = this.nodeId();
    const folderId = this.folderId();
    if (!subject || !nodeId || !folderId || this.deletingLinkId()) {
      return;
    }
    this.deletingLinkId.set(link.id);
    try {
      await this.data.deleteCurriculumMaterialLink(subject.id, nodeId, folderId, link.id);
      await this.reloadFiles();
    } finally {
      this.deletingLinkId.set(null);
    }
  }

  openNewNoteEditor(): void {
    this.openNoteEditor(null);
  }

  openNoteEditor(note: TenantCurriculumMaterialNote | null): void {
    this.activeNote.set(note);
    this.noteEditorOpen.set(true);
    this.noteError.set(null);
    setTimeout(() => void this.initializeEditor(note));
  }

  async closeNoteEditor(): Promise<void> {
    if (this.noteSaving()) {
      return;
    }
    await this.saveNote();
  }

  async saveNote(): Promise<void> {
    const subject = this.subject();
    const nodeId = this.nodeId();
    const folderId = this.folderId();
    if (!subject || !nodeId || !folderId || !this.editor || this.noteSaving()) {
      this.closeNoteEditorWithoutSave();
      return;
    }

    this.noteSaving.set(true);
    this.noteError.set(null);
    try {
      const output = await this.editor.save();
      const title = this.noteTitleFromOutput(output);
      const contentJson = JSON.stringify(output);
      const active = this.activeNote();
      if (active) {
        await this.data.updateCurriculumMaterialNote(subject.id, nodeId, folderId, active.id, { title, contentJson });
      } else {
        await this.data.createCurriculumMaterialNote(subject.id, nodeId, folderId, { title, contentJson });
      }
      this.closeNoteEditorWithoutSave();
      await this.reloadFiles();
    } catch (error) {
      this.noteError.set(this.data.toUserMessage(error, 'Unable to save note. Please try again.'));
    } finally {
      this.noteSaving.set(false);
    }
  }

  closeNoteEditorWithoutSave(): void {
    this.noteEditorOpen.set(false);
    this.activeNote.set(null);
    this.noteError.set(null);
    this.destroyEditor();
  }

  confirmDeleteNote(note: TenantCurriculumMaterialNote, event: Event): void {
    event.stopPropagation();
    this.deleteNoteError.set(null);
    this.notePendingDelete.set(note);
  }

  closeDeleteNoteModal(): void {
    if (this.deletingNoteId()) {
      return;
    }
    this.notePendingDelete.set(null);
    this.deleteNoteError.set(null);
  }

  async deleteNote(): Promise<void> {
    const subject = this.subject();
    const nodeId = this.nodeId();
    const folderId = this.folderId();
    const note = this.notePendingDelete();
    if (!subject || !nodeId || !folderId || !note || this.deletingNoteId()) {
      return;
    }

    this.deletingNoteId.set(note.id);
    this.deleteNoteError.set(null);
    try {
      await this.data.deleteCurriculumMaterialNote(subject.id, nodeId, folderId, note.id);
      this.notePendingDelete.set(null);
      await this.reloadFiles();
    } catch (error) {
      this.deleteNoteError.set(this.data.toUserMessage(error, 'Unable to delete note. Please try again.'));
    } finally {
      this.deletingNoteId.set(null);
    }
  }

  confirmDeleteFile(file: TenantCurriculumMaterialFile, event: Event): void {
    event.stopPropagation();
    this.deleteFileError.set(null);
    this.filePendingDelete.set(file);
  }

  closeDeleteFileModal(): void {
    if (this.deletingFileId()) {
      return;
    }
    this.filePendingDelete.set(null);
    this.deleteFileError.set(null);
  }

  async deleteFile(): Promise<void> {
    const subject = this.subject();
    const nodeId = this.nodeId();
    const folderId = this.folderId();
    const file = this.filePendingDelete();
    if (!subject || !nodeId || !folderId || !file || this.deletingFileId()) {
      return;
    }

    this.deletingFileId.set(file.id);
    this.deleteFileError.set(null);
    try {
      await this.data.deleteCurriculumMaterialFile(subject.id, nodeId, folderId, file.id);
      if (this.previewFile()?.id === file.id) {
        this.previewFile.set(null);
      }
      this.filePendingDelete.set(null);
      await this.reloadFiles();
    } catch (error) {
      this.deleteFileError.set(this.data.toUserMessage(error, 'Unable to delete material file. Please try again.'));
    } finally {
      this.deletingFileId.set(null);
    }
  }

  async uploadFile(event: Event): Promise<void> {
    const input = event.target instanceof HTMLInputElement ? event.target : null;
    const file = input?.files?.[0] ?? null;
    const subject = this.subject();
    const nodeId = this.nodeId();
    const folderId = this.folderId();
    if (!file || !subject || !nodeId || !folderId || this.uploading()) {
      return;
    }

    this.uploading.set(true);
    this.uploadError.set(null);
    this.uploadLoaded.set(0);
    this.uploadTotal.set(file.size);
    this.uploadFileName.set(file.name);
    try {
      await this.data.uploadCurriculumMaterialFileWithProgress(subject.id, nodeId, folderId, file, (loaded, total) => {
        this.uploadLoaded.set(loaded);
        this.uploadTotal.set(total);
      });
      await this.reloadFiles();
    } catch (error) {
      this.uploadError.set(this.data.toUserMessage(error, 'Unable to upload material file. Please try again.'));
    } finally {
      this.uploading.set(false);
      this.uploadLoaded.set(0);
      this.uploadTotal.set(0);
      this.uploadFileName.set('');
      if (input) {
        input.value = '';
      }
    }
  }

  private formatBytes(value: number): string {
    if (!value) {
      return '0 B';
    }
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    const amount = value / Math.pow(1024, index);
    return `${amount >= 10 || index === 0 ? Math.round(amount) : amount.toFixed(1)} ${units[index]}`;
  }

  private normalizedContentSearch(): string {
    return this.contentSearch().trim().toLowerCase();
  }

  private async preparePdfPreview(file: TenantCurriculumMaterialFile): Promise<void> {
    this.previewPdfLoading.set(true);
    this.previewPdfError.set(null);
    try {
      const blob = await firstValueFrom(this.http.get(file.url, { responseType: 'blob' }));
      if (this.previewFile()?.id !== file.id) {
        return;
      }
      this.revokePdfPreviewUrl();
      this.pdfPreviewObjectUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      this.previewPdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewObjectUrl));
    } catch {
      this.previewPdfError.set(this.i18n.language() === 'ar' ? 'تعذر عرض ملف PDF داخل الصفحة.' : 'Unable to preview this PDF inline.');
    } finally {
      if (this.previewFile()?.id === file.id) {
        this.previewPdfLoading.set(false);
      }
    }
  }

  private async preparePresentationPreview(file: TenantCurriculumMaterialFile): Promise<void> {
    this.previewPresentationLoading.set(true);
    this.previewPresentationError.set(null);
    try {
      await new Promise((resolve) => setTimeout(resolve));
      const host = this.presentationPreviewHost?.nativeElement;
      if (!host || this.previewFile()?.id !== file.id) {
        return;
      }

      host.replaceChildren();
      const [module, arrayBuffer] = await Promise.all([
        import('pptx-preview'),
        firstValueFrom(this.http.get(file.url, { responseType: 'arraybuffer' })),
      ]);
      if (this.previewFile()?.id !== file.id) {
        return;
      }

      this.destroyPresentationPreviewer();
      this.presentationPreviewer = module.init(host, { width: 960, height: 540, mode: 'list' });
      await this.presentationPreviewer.preview(arrayBuffer);
    } catch {
      this.previewPresentationError.set(this.i18n.language() === 'ar' ? 'تعذر عرض ملف العرض التقديمي داخل الصفحة.' : 'Unable to preview this presentation inline.');
    } finally {
      if (this.previewFile()?.id === file.id) {
        this.previewPresentationLoading.set(false);
      }
    }
  }

  private revokePdfPreviewUrl(): void {
    if (this.pdfPreviewObjectUrl) {
      URL.revokeObjectURL(this.pdfPreviewObjectUrl);
      this.pdfPreviewObjectUrl = null;
    }
    this.previewPdfUrl.set(null);
  }

  private destroyPresentationPreviewer(): void {
    if (this.presentationPreviewer) {
      this.presentationPreviewer.destroy();
      this.presentationPreviewer = null;
    }
    this.presentationPreviewHost?.nativeElement.replaceChildren();
  }

  private async initializeEditor(note: TenantCurriculumMaterialNote | null): Promise<void> {
    this.destroyEditor();
    await new Promise((resolve) => setTimeout(resolve));
    const host = this.noteEditorHost?.nativeElement;
    if (!host || !this.noteEditorOpen()) {
      return;
    }

    const [
      { default: Editor },
      { default: Header },
      { default: List },
      { default: Quote },
      { default: Table },
      { default: Delimiter },
      { default: Code },
    ] = await Promise.all([
      import('@editorjs/editorjs'),
      import('@editorjs/header'),
      import('@editorjs/list'),
      import('@editorjs/quote'),
      import('@editorjs/table'),
      import('@editorjs/delimiter'),
      import('@editorjs/code'),
    ]);
    this.editor = new Editor({
      holder: host,
      data: this.parseNoteContent(note?.contentJson) ?? this.emptyNoteData(),
      autofocus: true,
      placeholder: this.i18n.language() === 'ar' ? 'اكتب ملاحظتك هنا...' : 'Write your note here...',
      tools: {
        header: Header,
        list: List,
        quote: Quote,
        table: Table,
        delimiter: Delimiter,
        code: Code,
      },
    });
  }

  private destroyEditor(): void {
    if (this.editor?.destroy) {
      this.editor.destroy();
    }
    this.editor = null;
    this.noteEditorHost?.nativeElement.replaceChildren();
  }

  private emptyNoteData(): OutputData {
    return {
      time: Date.now(),
      blocks: [],
      version: '2.31.0',
    };
  }

  private parseNoteContent(contentJson: string | null | undefined): OutputData | null {
    if (!contentJson) {
      return null;
    }
    try {
      const parsed = JSON.parse(contentJson) as OutputData;
      return {
        ...parsed,
        blocks: Array.isArray(parsed.blocks) ? parsed.blocks : [],
      };
    } catch {
      return null;
    }
  }

  private noteTitleFromOutput(output: OutputData): string {
    const firstText = output.blocks
      .map((block) => this.noteBlockText(block))
      .find((text) => text.length > 0);
    return (firstText || (this.i18n.language() === 'ar' ? 'ملاحظة بدون عنوان' : 'Untitled note')).slice(0, 120);
  }

  private noteBlockText(block: OutputData['blocks'][number]): string {
    const data = block.data as Record<string, unknown>;
    const value = typeof data['text'] === 'string'
      ? data['text']
      : Array.isArray(data['items'])
        ? data['items'].join(' ')
        : '';
    return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private async load(subjectId: string | null): Promise<void> {
    this.curriculumRoot.set(null);
    this.folder.set(null);
    this.files.set([]);
    this.notes.set([]);
    this.links.set([]);
    await this.facade.loadSubject(subjectId);
    const subject = this.subject();
    const nodeId = this.nodeId();
    const folderId = this.folderId();
    if (!subject || !nodeId || !folderId) {
      return;
    }
    this.loadingFolder.set(true);
    this.folderError.set(null);
    try {
      this.curriculumRoot.set(await this.data.getSubjectCurriculum(subject.id));
      this.folder.set(await this.data.getCurriculumMaterialFolder(subject.id, nodeId, folderId));
      await this.reloadFiles();
    } catch (error) {
      this.folderError.set(this.data.toUserMessage(error, 'Unable to load material folder. Please try again.'));
    } finally {
      this.loadingFolder.set(false);
    }
  }

  private async reloadFiles(): Promise<void> {
    const subject = this.subject();
    const nodeId = this.nodeId();
    const folderId = this.folderId();
    if (!subject || !nodeId || !folderId) {
      return;
    }
    const [files, notes, links] = await Promise.all([
      this.data.listCurriculumMaterialFiles(subject.id, nodeId, folderId),
      this.data.listCurriculumMaterialNotes(subject.id, nodeId, folderId),
      this.data.listCurriculumMaterialLinks(subject.id, nodeId, folderId),
    ]);
    this.files.set(files);
    this.notes.set(notes);
    this.links.set(links);
    this.folder.set(await this.data.getCurriculumMaterialFolder(subject.id, nodeId, folderId));
  }

  private normalizedExternalUrl(url: string): string {
    const value = url.trim();
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }

  private youtubeEmbedUrl(url: string): string | null {
    try {
      const parsed = new URL(this.normalizedExternalUrl(url));
      const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
      let videoId: string | null = null;
      if (host === 'youtu.be') {
        videoId = parsed.pathname.split('/').filter(Boolean)[0] ?? null;
      } else if (host === 'youtube.com' || host === 'm.youtube.com') {
        if (parsed.pathname.startsWith('/watch')) {
          videoId = parsed.searchParams.get('v');
        } else if (parsed.pathname.startsWith('/embed/') || parsed.pathname.startsWith('/shorts/')) {
          videoId = parsed.pathname.split('/').filter(Boolean)[1] ?? null;
        }
      }
      return videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` : null;
    } catch {
      return null;
    }
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
