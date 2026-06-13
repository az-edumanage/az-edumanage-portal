import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type EditorJS from '@editorjs/editorjs';
import type { OutputData } from '@editorjs/editorjs';
import { I18nService } from '../../../../core/services/i18n.service';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantCurriculumMaterialFolder, TenantCurriculumMaterialNote, TenantSubjectCurriculumNode } from '../../models/tenant-subjects.models';
import { TenantSubjectDetailsFacade } from '../../state/tenant-subject-details.facade';

interface CurriculumPathItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-tenant-subject-curriculum-material-note',
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-subject-curriculum-material-note.component.html',
  styleUrls: ['./tenant-subject-curriculum-material-note.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantSubjectCurriculumMaterialNoteComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TenantSubjectDetailsFacade);
  private readonly data = inject(TenantSubjectsDataService);
  private readonly i18n = inject(I18nService);
  private editor: EditorJS | null = null;

  @ViewChild('noteEditorHost')
  private noteEditorHost?: ElementRef<HTMLElement>;

  readonly subject = this.facade.subject;
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;
  readonly curriculumRoot = signal<TenantSubjectCurriculumNode | null>(null);
  readonly folder = signal<TenantCurriculumMaterialFolder | null>(null);
  readonly activeNote = signal<TenantCurriculumMaterialNote | null>(null);
  readonly nodeId = signal<string | null>(null);
  readonly folderId = signal<string | null>(null);
  readonly noteId = signal<string | null>(null);
  readonly loadingPage = signal(false);
  readonly pageError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly materialFolderLink = computed(() => {
    const subject = this.subject();
    const nodeId = this.nodeId();
    const folderId = this.folderId();
    return subject && nodeId && folderId ? [this.subjectsRootLink(), subject.id, 'curriculum', nodeId, 'material', folderId] : [this.subjectsRootLink()];
  });

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

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.nodeId.set(params.get('nodeId'));
        this.folderId.set(params.get('folderId'));
        this.noteId.set(params.get('noteId'));
        void this.load(params.get('id'));
      });
  }

  ngOnDestroy(): void {
    this.destroyEditor();
  }

  pageDirection(): 'ltr' | 'rtl' {
    return this.i18n.language() === 'ar' ? 'rtl' : 'ltr';
  }

  breadcrumbLabel(key: 'subject' | 'subjectDetails' | 'curriculum' | 'material' | 'note'): string {
    const labels = {
      subject: { en: 'Subject', ar: 'المادة' },
      subjectDetails: { en: 'Subject Details', ar: 'تفاصيل المادة' },
      curriculum: { en: 'Curriculum', ar: 'المنهج' },
      material: { en: 'Material', ar: 'الملحقات' },
      note: { en: 'Note', ar: 'ملاحظة' },
    } as const;
    return labels[key][this.i18n.language()];
  }

  breadcrumbSeparatorIcon(): string {
    return this.i18n.language() === 'ar' ? 'chevron_left' : 'chevron_right';
  }

  subjectsListLink(): unknown[] {
    return [this.subjectsRootLink()];
  }

  breadcrumbPathLabel(item: CurriculumPathItem, first: boolean): string {
    const subject = this.subject();
    if (first && this.i18n.language() === 'ar') {
      return subject ? `منهج ${subject.name}` : 'منهج اسم المادة';
    }
    return item.label;
  }

  titleLabel(): string {
    const note = this.activeNote();
    if (note) {
      return note.title;
    }
    return this.i18n.language() === 'ar' ? 'إضافة ملاحظة' : 'Add Note';
  }

  subtitleLabel(): string {
    const folder = this.folder();
    return folder
      ? (this.i18n.language() === 'ar' ? `داخل ${folder.name}` : `Inside ${folder.name}`)
      : this.breadcrumbLabel('material');
  }

  saveNoteLabel(): string {
    return this.i18n.language() === 'ar' ? 'حفظ الملاحظة' : 'Save Note';
  }

  cancelLabel(): string {
    return this.i18n.language() === 'ar' ? 'إلغاء' : 'Cancel';
  }

  async saveNote(): Promise<void> {
    const subject = this.subject();
    const nodeId = this.nodeId();
    const folderId = this.folderId();
    if (!subject || !nodeId || !folderId || !this.editor || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);
    try {
      const output = await this.editor.save();
      const title = this.noteTitleFromOutput(output);
      const contentJson = JSON.stringify(output);
      const note = this.activeNote();
      if (note) {
        await this.data.updateCurriculumMaterialNote(subject.id, nodeId, folderId, note.id, { title, contentJson });
      } else {
        await this.data.createCurriculumMaterialNote(subject.id, nodeId, folderId, { title, contentJson });
      }
      await this.router.navigate(this.materialFolderLink());
    } catch (error) {
      this.saveError.set(this.data.toUserMessage(error, 'Unable to save note. Please try again.'));
    } finally {
      this.saving.set(false);
    }
  }

  private async load(subjectId: string | null): Promise<void> {
    this.destroyEditor();
    this.curriculumRoot.set(null);
    this.folder.set(null);
    this.activeNote.set(null);
    this.loadingPage.set(true);
    this.pageError.set(null);
    this.saveError.set(null);
    try {
      await this.facade.loadSubject(subjectId);
      const subject = this.subject();
      const nodeId = this.nodeId();
      const folderId = this.folderId();
      if (!subject || !nodeId || !folderId) {
        return;
      }

      const [root, folder, notes] = await Promise.all([
        this.data.getSubjectCurriculum(subject.id),
        this.data.getCurriculumMaterialFolder(subject.id, nodeId, folderId),
        this.data.listCurriculumMaterialNotes(subject.id, nodeId, folderId),
      ]);
      const noteId = this.noteId();
      const note = noteId ? notes.find((item) => item.id === noteId) ?? null : null;
      this.curriculumRoot.set(root);
      this.folder.set(folder);
      this.activeNote.set(note);
      this.loadingPage.set(false);
      await this.initializeEditor(note);
    } catch (error) {
      this.pageError.set(this.data.toUserMessage(error, 'Unable to load note editor. Please try again.'));
    } finally {
      this.loadingPage.set(false);
    }
  }

  private async initializeEditor(note: TenantCurriculumMaterialNote | null): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    const host = this.noteEditorHost?.nativeElement;
    if (!host) {
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
    const editor = new Editor({
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
    this.editor = editor;
    await editor.isReady;
    editor.caret.focus(true);
  }

  private destroyEditor(): void {
    if (this.editor?.destroy) {
      this.editor.destroy();
    }
    this.editor = null;
    this.noteEditorHost?.nativeElement.replaceChildren();
  }

  private parseNoteContent(contentJson?: string | null): OutputData | null {
    if (!contentJson) {
      return null;
    }
    try {
      const parsed = JSON.parse(contentJson) as OutputData;
      return Array.isArray(parsed.blocks) ? parsed : null;
    } catch {
      return null;
    }
  }

  private emptyNoteData(): OutputData {
    return {
      time: Date.now(),
      blocks: [],
      version: '2.31.6',
    };
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
