import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { I18nService } from '../../../../core/services/i18n.service';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantSubjectCurriculumNode } from '../../models/tenant-subjects.models';
import { TenantSubjectDetailsFacade } from '../../state/tenant-subject-details.facade';

type CurriculumTreeNode = TenantSubjectCurriculumNode;

interface CurriculumNodeModalState {
  mode: 'add' | 'edit';
  nodeId: string;
}

interface CurriculumNodeDeleteState {
  nodeId: string;
  label: string;
}

interface CurriculumPathItem {
  id: string;
  label: string;
}

type QuestionsBankBreadcrumbKey = 'questionsBank' | 'basicEducation' | 'universityEducation' | 'stage' | 'grade' | 'college' | 'subject' | 'curriculum';

@Component({
  selector: 'app-tenant-subject-curriculum',
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './tenant-subject-curriculum.component.html',
  styleUrls: ['./tenant-subject-curriculum.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantSubjectCurriculumComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TenantSubjectDetailsFacade);
  private readonly data = inject(TenantSubjectsDataService);
  private readonly i18n = inject(I18nService);

  readonly subject = this.facade.subject;
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;
  readonly curriculumLoading = signal(false);
  readonly curriculumError = signal<string | null>(null);
  readonly savingNode = signal(false);
  readonly expandedNodeIds = signal(new Set<string>(['curriculum']));
  readonly selectedNodeId = signal('curriculum');
  readonly curriculumTreeNodes = signal<CurriculumTreeNode[]>([]);
  readonly nodeModal = signal<CurriculumNodeModalState | null>(null);
  readonly deleteNodeModal = signal<CurriculumNodeDeleteState | null>(null);
  readonly deletingNodeId = signal<string | null>(null);
  readonly deleteNodeError = signal<string | null>(null);
  readonly nodeName = signal('');
  readonly nodeDescription = signal('');
  readonly subjectDetailsLink = computed(() => {
    const subject = this.subject();
    if (this.isQuestionsBankRoute()) {
      return subject ? this.questionsBankSubjectLink(subject.id) : this.questionsBankSubjectsLink();
    }
    if (this.isUniversityQuestionsBankRoute()) {
      return subject ? this.universityQuestionsBankSubjectLink(subject.id) : this.universityQuestionsBankSubjectsLink();
    }
    return subject ? [this.subjectsRootLink(), subject.id] : [this.subjectsRootLink()];
  });
  readonly curriculumTree = computed<CurriculumTreeNode[]>(() => {
    const nodes = this.curriculumTreeNodes();
    return nodes.length ? nodes : this.buildDefaultCurriculumTree();
  });
  readonly selectedCurriculumPath = computed(() => {
    const path = this.findNodePath(this.curriculumTree(), this.selectedNodeId());
    return path.length ? path : [{ id: 'curriculum', label: this.curriculumRootLabel() }];
  });
  readonly selectedCurriculumChildren = computed(() => {
    const selectedNode = this.findNode(this.curriculumTree(), this.selectedNodeId());
    return selectedNode?.children ?? [];
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        void this.loadSubjectAndCurriculum(params.get('id'));
      });
  }

  isQuestionsBankRoute(): boolean {
    return this.isBasicQuestionsBankRoute();
  }

  isAnyQuestionsBankRoute(): boolean {
    return this.isBasicQuestionsBankRoute() || this.isUniversityQuestionsBankRoute();
  }

  isBasicQuestionsBankRoute(): boolean {
    return this.router.url.startsWith('/tenant/questions-bank/basic-education');
  }

  isUniversityQuestionsBankRoute(): boolean {
    return this.router.url.startsWith('/tenant/questions-bank/university-education');
  }

  isExpanded(nodeId: string): boolean {
    return this.expandedNodeIds().has(nodeId);
  }

  toggleNode(nodeId: string): void {
    const next = new Set(this.expandedNodeIds());
    if (next.has(nodeId)) {
      next.delete(nodeId);
    } else {
      next.add(nodeId);
    }
    this.expandedNodeIds.set(next);
  }

  selectTreeNode(nodeId: string): void {
    const node = this.findNode(this.curriculumTree(), nodeId);
    if (!node) {
      return;
    }

    if (this.isQuestionsBankRoute() && node.id !== 'curriculum' && !node.children.length) {
      void this.router.navigate(this.curriculumNodeDetailsLink(node.id));
      return;
    }

    if (node.id !== 'curriculum' && !node.children.length) {
      void this.router.navigate(this.curriculumNodeDetailsLink(node.id));
      return;
    }

    this.selectedNodeId.set(nodeId);
  }

  openCurriculumContentItem(nodeId: string): void {
    const node = this.findNode(this.curriculumTree(), nodeId);
    if (!node) {
      return;
    }

    if (node.children.length) {
      this.selectedNodeId.set(nodeId);
      const expanded = new Set(this.expandedNodeIds());
      expanded.add(nodeId);
      this.expandedNodeIds.set(expanded);
      return;
    }

    if (this.isAnyQuestionsBankRoute()) {
      void this.router.navigate(this.curriculumNodeQuestionsLink(nodeId));
      return;
    }

    this.selectTreeNode(nodeId);
  }

  canSelectTreeNode(nodeId: string): boolean {
    if (nodeId === 'curriculum') {
      return true;
    }

    return Boolean(this.findNode(this.curriculumTree(), nodeId));
  }

  isRtl(): boolean {
    return this.i18n.language() === 'ar';
  }

  pageDirection(): 'rtl' | 'ltr' {
    return this.isRtl() ? 'rtl' : 'ltr';
  }

  breadcrumbLabel(key: 'subject' | 'subjectDetails'): string {
    if (this.isQuestionsBankRoute()) {
      const labels = {
        subject: { en: 'Questions Bank', ar: 'بنك الأسئلة' },
        subjectDetails: { en: 'Subjects', ar: 'المواد' },
      } as const;
      return labels[key][this.i18n.language()];
    }

    const labels = {
      subject: { en: 'Subject', ar: 'المادة' },
      subjectDetails: { en: 'Subject Details', ar: 'تفاصيل المادة' },
    } as const;
    return labels[key][this.i18n.language()];
  }

  questionsBankBreadcrumbLabel(key: QuestionsBankBreadcrumbKey): string {
    const labels = {
      questionsBank: { en: 'Questions Bank', ar: 'بنك الأسئلة' },
      basicEducation: { en: 'Basic Education', ar: 'التعليم الأساسي' },
      universityEducation: { en: 'University Education', ar: 'التعليم الجامعي' },
      stage: { en: 'Stage', ar: 'المرحلة' },
      grade: { en: 'Grade', ar: 'الصف' },
      college: { en: 'College', ar: 'الكلية' },
      subject: { en: 'Subject', ar: 'المادة' },
      curriculum: { en: 'Curriculum', ar: 'المنهج' },
    } as const;
    return labels[key][this.i18n.language()];
  }

  subjectsListLink(): unknown[] {
    if (this.isQuestionsBankRoute()) {
      return this.questionsBankSubjectsLink();
    }
    if (this.isUniversityQuestionsBankRoute()) {
      return this.universityQuestionsBankSubjectsLink();
    }
    return [this.subjectsRootLink()];
  }

  breadcrumbSeparatorIcon(): string {
    return this.isRtl() ? 'chevron_left' : 'chevron_right';
  }

  curriculumTitle(): string {
    const subject = this.subject();
    if (this.isRtl()) {
      return subject ? `منهج ${subject.name}` : 'منهج اسم المادة';
    }
    return subject ? `${subject.name} Curriculum` : 'Curriculum';
  }

  curriculumTreeTitle(): string {
    return this.isRtl() ? 'فهرس المنهج' : 'Curriculum Tree';
  }

  tableHeaderLabel(key: 'content' | 'description' | 'actions'): string {
    const labels = {
      content: { en: 'Content', ar: 'المحتوى' },
      description: { en: 'Description', ar: 'الوصف' },
      actions: { en: 'Actions', ar: 'الاجرائات' },
    } as const;
    return labels[key][this.i18n.language()];
  }

  nodeModalTitle(modal: CurriculumNodeModalState): string {
    const node = this.findNode(this.curriculumTree(), modal.nodeId);
    if (modal.mode === 'edit') {
      return this.isRtl() ? `تعديل ${node?.label ?? ''}`.trim() : `Edit ${node?.label ?? ''}`.trim();
    }

    const parentLabel = node ? this.nodeDisplayLabel(node) : '';
    return this.isRtl() ? `إضافة عنصر داخل ${parentLabel}`.trim() : `Add sub under ${parentLabel}`.trim();
  }

  nodeModalLabel(key: 'description' | 'close' | 'name' | 'namePlaceholder' | 'nodeDescription' | 'descriptionPlaceholder' | 'cancel' | 'save'): string {
    const labels = {
      description: { en: 'Set the name and optional description.', ar: 'حدد الاسم والوصف الاختياري.' },
      close: { en: 'Close modal', ar: 'إغلاق النافذة' },
      name: { en: 'Name', ar: 'الاسم' },
      namePlaceholder: { en: 'Enter name', ar: 'ادخل الاسم' },
      nodeDescription: { en: 'Description', ar: 'الوصف' },
      descriptionPlaceholder: { en: 'Enter description', ar: 'ادخل الوصف' },
      cancel: { en: 'Cancel', ar: 'إلغاء' },
      save: { en: 'Save', ar: 'حفظ' },
    } as const;
    return labels[key][this.i18n.language()];
  }

  deleteNodeModalTitle(): string {
    return this.isRtl() ? 'حذف عنصر المنهج' : 'Delete curriculum item';
  }

  deleteNodeModalMessage(node: CurriculumNodeDeleteState): string {
    return this.isRtl() ? `هل تريد حذف "${node.label}"؟` : `Delete "${node.label}"?`;
  }

  deleteNodeBlockedMessage(): string {
    return this.isRtl()
      ? 'لا يمكن حذف هذا العنصر لأنه يحتوي على محتوى داخلي. احذف العناصر الداخلية أولا.'
      : 'This item cannot be deleted because it has inner content. Delete its inner items first.';
  }

  deleteNodeHelpMessage(): string {
    return this.isRtl()
      ? 'سيتم حذف العنصر فقط إذا لم يكن يحتوي على محتوى داخلي.'
      : 'This item will be deleted only if it has no inner content.';
  }

  deleteNodeConfirmLabel(): string {
    return this.deletingNodeId() ? (this.isRtl() ? 'جاري الحذف...' : 'Deleting...') : this.actionTooltipLabel('delete');
  }

  actionTooltipLabel(key: 'add' | 'details' | 'edit' | 'materials' | 'questions' | 'delete'): string {
    const labels = {
      add: { en: 'Add sub', ar: 'إضافة' },
      details: { en: 'Details', ar: 'التفاصيل' },
      edit: { en: 'Edit', ar: 'تعديل' },
      materials: { en: 'Materials', ar: 'الملحقات' },
      questions: { en: 'Questions', ar: 'الأسئلة' },
      delete: { en: 'Delete', ar: 'حذف' },
    } as const;
    return labels[key][this.i18n.language()];
  }

  treeToggleIcon(nodeId: string): string {
    return this.isExpanded(nodeId) ? 'expand_more' : this.breadcrumbSeparatorIcon();
  }

  nodeDisplayLabel(node: CurriculumPathItem | CurriculumTreeNode): string {
    return node.id === 'curriculum' ? this.curriculumTitle() : node.label;
  }

  curriculumNodeDetailsLink(nodeId: string): unknown[] {
    const subject = this.subject();
    if (this.isQuestionsBankRoute()) {
      return subject ? [...this.questionsBankSubjectLink(subject.id), 'curriculum', nodeId] : this.questionsBankSubjectsLink();
    }
    if (this.isUniversityQuestionsBankRoute()) {
      return subject ? [...this.universityQuestionsBankSubjectLink(subject.id), 'curriculum', nodeId] : this.universityQuestionsBankSubjectsLink();
    }
    return subject ? [this.subjectsRootLink(), subject.id, 'curriculum', nodeId] : [this.subjectsRootLink()];
  }

  curriculumNodeMaterialLink(nodeId: string): unknown[] {
    return this.curriculumNodeDetailsLink(nodeId);
  }

  curriculumNodeQuestionsLink(nodeId: string): unknown[] {
    const subject = this.subject();
    if (this.isQuestionsBankRoute()) {
      return subject ? [...this.questionsBankSubjectLink(subject.id), 'curriculum', nodeId] : this.questionsBankSubjectsLink();
    }
    if (this.isUniversityQuestionsBankRoute()) {
      return subject ? [...this.universityQuestionsBankSubjectLink(subject.id), 'curriculum', nodeId] : this.universityQuestionsBankSubjectsLink();
    }
    return subject ? [this.subjectsRootLink(), subject.id, 'curriculum', nodeId, 'addQuestion'] : [this.subjectsRootLink()];
  }

  questionsBankStageLink(): unknown[] {
    if (this.isUniversityQuestionsBankRoute()) {
      return ['/tenant/questions-bank/university-education'];
    }
    const stageId = this.questionsBankStageId();
    return stageId
      ? ['/tenant/questions-bank/basic-education', stageId]
      : ['/tenant/questions-bank/basic-education'];
  }

  questionsBankSubjectsLink(): unknown[] {
    if (this.isUniversityQuestionsBankRoute()) {
      const collegeId = this.questionsBankCollegeId();
      return collegeId
        ? ['/tenant/questions-bank/university-education/colleges', collegeId]
        : ['/tenant/questions-bank/university-education'];
    }
    const stageId = this.questionsBankStageId();
    const gradeId = this.questionsBankGradeId();
    return stageId && gradeId
      ? ['/tenant/questions-bank/basic-education', stageId, 'grades', gradeId]
      : this.questionsBankStageLink();
  }

  openAddNode(parentId: string): void {
    this.nodeName.set('');
    this.nodeDescription.set('');
    this.nodeModal.set({
      mode: 'add',
      nodeId: parentId,
    });
  }

  openEditNode(nodeId: string): void {
    if (nodeId === 'curriculum') {
      return;
    }
    const node = this.findNode(this.curriculumTree(), nodeId);
    if (!node) {
      return;
    }

    this.nodeName.set(node.label);
    this.nodeDescription.set(node.description ?? '');
    this.nodeModal.set({
      mode: 'edit',
      nodeId,
    });
  }

  openDeleteNode(nodeId: string): void {
    if (nodeId === 'curriculum') {
      return;
    }
    const node = this.findNode(this.curriculumTree(), nodeId);
    if (!node) {
      return;
    }
    this.deleteNodeError.set(null);
    this.deleteNodeModal.set({ nodeId, label: node.label });
  }

  closeDeleteNodeModal(): void {
    if (this.deletingNodeId()) {
      return;
    }
    this.deleteNodeModal.set(null);
    this.deleteNodeError.set(null);
  }

  canDeletePendingNode(): boolean {
    const modal = this.deleteNodeModal();
    if (!modal) {
      return false;
    }
    const node = this.findNode(this.curriculumTree(), modal.nodeId);
    return Boolean(node && node.id !== 'curriculum' && !node.children.length);
  }

  async deleteNode(nodeId: string): Promise<void> {
    const subject = this.subject();
    const node = this.findNode(this.curriculumTree(), nodeId);
    if (!subject || !node || nodeId === 'curriculum' || node.children.length || this.deletingNodeId()) {
      return;
    }

    this.deletingNodeId.set(nodeId);
    this.deleteNodeError.set(null);
    try {
      await this.data.deleteSubjectCurriculumNode(subject.id, nodeId);
      this.deleteNodeModal.set(null);
      await this.loadCurriculum(subject.id);
    } catch (error) {
      this.deleteNodeError.set(this.data.toUserMessage(error, 'Unable to delete curriculum item. Please try again.'));
      return;
    } finally {
      this.deletingNodeId.set(null);
    }

    const expanded = new Set(this.expandedNodeIds());
    expanded.delete(nodeId);
    this.expandedNodeIds.set(expanded);
    if (!this.findNode(this.curriculumTree(), this.selectedNodeId())) {
      this.selectedNodeId.set('curriculum');
    }
  }

  closeNodeModal(): void {
    this.nodeModal.set(null);
    this.nodeName.set('');
    this.nodeDescription.set('');
  }

  async saveNodeModal(): Promise<void> {
    const modal = this.nodeModal();
    const subject = this.subject();
    const name = this.nodeName().trim();
    if (!modal || !subject || !name || this.savingNode()) {
      return;
    }

    this.savingNode.set(true);
    this.curriculumError.set(null);
    try {
      if (modal.mode === 'add') {
        const created = await this.data.createSubjectCurriculumNode(subject.id, {
          parentId: modal.nodeId === 'curriculum' ? null : modal.nodeId,
          name,
          description: this.nodeDescription().trim() || null,
        });
        await this.loadCurriculum(subject.id);
        const expanded = new Set(this.expandedNodeIds());
        expanded.add(modal.nodeId);
        this.expandedNodeIds.set(expanded);
        if (created.children.length) {
          this.selectedNodeId.set(created.id);
        }
      } else {
        await this.data.updateSubjectCurriculumNode(subject.id, modal.nodeId, {
          name,
          description: this.nodeDescription().trim() || null,
        });
        await this.loadCurriculum(subject.id);
        this.selectedNodeId.set(modal.nodeId);
      }
      this.closeNodeModal();
    } catch (error) {
      this.curriculumError.set(this.data.toUserMessage(error, 'Unable to save curriculum item. Please try again.'));
    } finally {
      this.savingNode.set(false);
    }
  }

  private async loadSubjectAndCurriculum(subjectId: string | null): Promise<void> {
    this.selectedNodeId.set('curriculum');
    this.expandedNodeIds.set(new Set(['curriculum']));
    this.curriculumTreeNodes.set([]);
    await this.facade.loadSubject(subjectId);
    const subject = this.subject();
    if (subject) {
      await this.loadCurriculum(subject.id);
    }
  }

  private async loadCurriculum(subjectId: string): Promise<void> {
    this.curriculumLoading.set(true);
    this.curriculumError.set(null);
    try {
      this.curriculumTreeNodes.set([await this.data.getSubjectCurriculum(subjectId)]);
    } catch (error) {
      this.curriculumError.set(this.data.toUserMessage(error, 'Unable to load curriculum. Please try again.'));
      this.curriculumTreeNodes.set(this.buildDefaultCurriculumTree());
    } finally {
      this.curriculumLoading.set(false);
    }
  }

  private buildDefaultCurriculumTree(): CurriculumTreeNode[] {
    return [{ id: 'curriculum', label: this.curriculumRootLabel(), icon: 'folder', description: null, children: [] }];
  }

  private findNode(nodes: CurriculumTreeNode[], nodeId: string): CurriculumTreeNode | null {
    for (const node of nodes) {
      if (node.id === nodeId) {
        return node;
      }

      const child = node.children?.length ? this.findNode(node.children, nodeId) : null;
      if (child) {
        return child;
      }
    }

    return null;
  }

  private findNodePath(nodes: CurriculumTreeNode[], nodeId: string, parents: CurriculumPathItem[] = []): CurriculumPathItem[] {
    for (const node of nodes) {
      const path = [...parents, { id: node.id, label: node.label }];
      if (node.id === nodeId) {
        return path;
      }

      const childPath = node.children?.length ? this.findNodePath(node.children, nodeId, path) : [];
      if (childPath.length) {
        return childPath;
      }
    }

    return [];
  }

  private curriculumRootLabel(): string {
    return `${this.subject()?.name ?? 'Subject'} Curriculum`;
  }

  private subjectsRootLink(): string {
    return this.router.url.startsWith('/tenant/university-subjects') ? '/tenant/university-subjects' : '/tenant/subjects';
  }

  private questionsBankStageId(): string {
    return this.route.snapshot?.paramMap.get('stageId') ?? this.subject()?.stageId ?? '';
  }

  private questionsBankGradeId(): string {
    return this.route.snapshot?.paramMap.get('gradeId') ?? this.subject()?.gradeId ?? '';
  }

  private questionsBankCollegeId(): string {
    return this.route.snapshot?.paramMap.get('collegeId') ?? this.subject()?.gradeId ?? '';
  }

  private questionsBankSubjectLink(subjectId: string): unknown[] {
    return [...this.questionsBankSubjectsLink(), 'subjects', subjectId];
  }

  private universityQuestionsBankSubjectsLink(): unknown[] {
    const collegeId = this.questionsBankCollegeId();
    return collegeId
      ? ['/tenant/questions-bank/university-education/colleges', collegeId]
      : ['/tenant/questions-bank/university-education'];
  }

  private universityQuestionsBankSubjectLink(subjectId: string): unknown[] {
    return [...this.universityQuestionsBankSubjectsLink(), 'subjects', subjectId];
  }

}
