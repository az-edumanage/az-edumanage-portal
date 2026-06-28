import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, RouterLink, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { I18nService } from '../../../../core/services/i18n.service';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantSubjectCurriculumNode } from '../../models/tenant-subjects.models';
import { TenantSubjectDetailsFacade } from '../../state/tenant-subject-details.facade';
import { TenantSubjectCurriculumComponent } from './tenant-subject-curriculum.component';

describe('TenantSubjectCurriculumComponent', () => {
  let fixture: ComponentFixture<TenantSubjectCurriculumComponent>;
  let curriculumRoot: TenantSubjectCurriculumNode;
  let nextNodeIndex: number;
  const facade = {
    subject: signal({
      id: 'subject-1',
      name: 'Mathematics',
      stageId: 'stage-1',
      stageName: 'Secondary',
      gradeId: 'grade-1',
      gradeName: 'Grade 10',
      assignedGroupsCount: 1,
      assignedTeachersCount: 0,
      totalStudentsCount: 0,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      groups: [{ id: 'group-1', name: 'Group A', studentsCount: 0, teacherName: null }],
      teachers: [],
    }),
    loading: signal(false),
    loadError: signal<string | null>(null),
    loadSubject: vi.fn().mockResolvedValue(undefined),
  };
  const cloneNode = (node: TenantSubjectCurriculumNode): TenantSubjectCurriculumNode => ({
    ...node,
    children: node.children.map((child) => cloneNode(child)),
  });
  const findNode = (node: TenantSubjectCurriculumNode, id: string): TenantSubjectCurriculumNode | null => {
    if (node.id === id) {
      return node;
    }
    for (const child of node.children) {
      const match = findNode(child, id);
      if (match) {
        return match;
      }
    }
    return null;
  };
  const removeNode = (node: TenantSubjectCurriculumNode, id: string): void => {
    node.children = node.children.filter((child) => child.id !== id);
    node.children.forEach((child) => removeNode(child, id));
    node.icon = node.children.length ? 'folder' : 'description';
  };
  const data = {
    getSubjectCurriculum: vi.fn(async () => cloneNode(curriculumRoot)),
    createSubjectCurriculumNode: vi.fn(async (_subjectId: string, payload: { parentId: string | null; name: string; description: string | null }) => {
      const created: TenantSubjectCurriculumNode = {
        id: `node-${nextNodeIndex}`,
        label: payload.name,
        icon: 'description',
        description: payload.description,
        children: [],
      };
      nextNodeIndex += 1;
      const parent = payload.parentId ? findNode(curriculumRoot, payload.parentId) : curriculumRoot;
      parent?.children.push(created);
      if (parent) {
        parent.icon = 'folder';
      }
      return cloneNode(created);
    }),
    updateSubjectCurriculumNode: vi.fn(async (_subjectId: string, nodeId: string, payload: { name: string; description: string | null }) => {
      const node = findNode(curriculumRoot, nodeId);
      if (node) {
        node.label = payload.name;
        node.description = payload.description;
      }
      return cloneNode(node as TenantSubjectCurriculumNode);
    }),
    deleteSubjectCurriculumNode: vi.fn(async (_subjectId: string, nodeId: string) => {
      removeNode(curriculumRoot, nodeId);
    }),
    toUserMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  };
  const i18n = {
    language: signal<'en' | 'ar'>('en'),
  };

  beforeEach(async () => {
    curriculumRoot = {
      id: 'curriculum',
      label: 'Mathematics Curriculum',
      icon: 'folder',
      description: null,
      children: [],
    };
    nextNodeIndex = 1;
    await TestBed.configureTestingModule({
      imports: [TenantSubjectCurriculumComponent],
      providers: [
        provideRouter([]),
        { provide: TenantSubjectDetailsFacade, useValue: facade },
        { provide: TenantSubjectsDataService, useValue: data },
        { provide: I18nService, useValue: i18n },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: 'subject-1' })) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantSubjectCurriculumComponent);
    fixture.detectChanges();
    await settle();
  });

  afterEach(() => {
    vi.clearAllMocks();
    i18n.language.set('en');
  });

  it('renders curriculum breadcrumb and subject classification', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Subject');
    expect(text).toContain('Subject Details');
    expect(text).toContain('Curriculum');
    expect(text).toContain('Mathematics Curriculum');
    expect(text).toContain('Secondary');
    expect(text).toContain('Grade 10');
    expect(text).toContain('Curriculum Tree');
    expect(text).toContain('Content');
    expect(text).toContain('Description');
    expect(text).toContain('Actions');
    expect(text).toContain('No content yet.');
    expect(text).not.toContain('First Term');
    expect(text).not.toContain('Unit 1');
    expect(text).not.toContain('Subject Name');
    expect(text).not.toContain('Last Seen');
  });

  it('renders Arabic breadcrumb, curriculum tree, and content table in RTL', () => {
    i18n.language.set('ar');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('المادة');
    expect(text).toContain('تفاصيل المادة');
    expect(text).toContain('منهج Mathematics');
    expect(text).toContain('فهرس المنهج');
    expect(text).toContain('المحتوى');
    expect(text).toContain('الوصف');
    expect(text).toContain('الاجرائات');
    expect(text).not.toContain('Subject Details');
    expect(text).not.toContain('Curriculum Tree');

    const page = fixture.debugElement.query(By.css('.space-y-6')).nativeElement as HTMLElement;
    const tree = fixture.debugElement.query(By.css('.curriculum-tree')).nativeElement as HTMLElement;
    const table = fixture.debugElement.query(By.css('.curriculum-content-table')).nativeElement as HTMLElement;
    const breadcrumbIcons = fixture.debugElement.queryAll(By.css('.curriculum-page-breadcrumb mat-icon'));

    expect(page.getAttribute('dir')).toBe('rtl');
    expect(tree.getAttribute('dir')).toBe('rtl');
    expect(table.getAttribute('dir')).toBe('rtl');
    expect(breadcrumbIcons.length).toBeGreaterThan(0);
    expect(breadcrumbIcons.every((icon) => (icon.nativeElement as HTMLElement).textContent?.trim() === 'chevron_left')).toBe(true);
  });

  it('keeps the curriculum actions column aligned to the left edge in RTL', async () => {
    await addRootChild('First Term');
    i18n.language.set('ar');
    fixture.detectChanges();

    const table = fixture.debugElement.query(By.css('.curriculum-content-table')).nativeElement as HTMLElement;
    const actionsHeader = fixture.debugElement.query(By.css('thead .curriculum-content-table-actions-cell')).nativeElement as HTMLElement;
    const firstRowCells = fixture.debugElement.queryAll(By.css('tbody tr:first-child td'));
    const contentCell = firstRowCells[0].nativeElement as HTMLElement;
    const actionsCell = firstRowCells[2].nativeElement as HTMLElement;

    expect(table.getAttribute('dir')).toBe('rtl');
    expect(actionsHeader.classList.contains('curriculum-content-table-actions-cell')).toBe(true);
    expect(contentCell.classList.contains('curriculum-content-table-actions-cell')).toBe(false);
    expect(actionsCell.classList.contains('curriculum-content-table-actions-cell')).toBe(true);
  });

  it('shows clickable selected curriculum tree path in the right panel header', async () => {
    await addRootChild('First Term');
    await addChild('node-1', 'Unit 1');
    const header = fixture.debugElement.query(By.css('.curriculum-panel-breadcrumb')).nativeElement as HTMLElement;
    expect(header.textContent).toContain('Mathematics Curriculum');

    const firstTermLabel = fixture.debugElement
      .queryAll(By.css('.curriculum-tree-label'))
      .find((button) => (button.nativeElement as HTMLElement).textContent?.trim() === 'First Term');

    expect(firstTermLabel).toBeDefined();
    firstTermLabel?.triggerEventHandler('click');
    fixture.detectChanges();

    expect(header.textContent).toContain('Mathematics Curriculum');
    expect(header.textContent).toContain('First Term');

    const rootBreadcrumb = fixture.debugElement
      .queryAll(By.css('.curriculum-panel-breadcrumb-button'))
      .find((button) => (button.nativeElement as HTMLElement).textContent?.trim() === 'Mathematics Curriculum');

    expect(rootBreadcrumb).toBeDefined();
    rootBreadcrumb?.triggerEventHandler('click');
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedNodeId()).toBe('curriculum');
  });

  it('routes a leaf curriculum sidebar item to details under university subjects', async () => {
    await addRootChild('First Term');
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/tenant/university-subjects/subject-1/curriculum');
    const firstTermLabel = fixture.debugElement
      .queryAll(By.css('.curriculum-tree-label'))
      .find((button) => (button.nativeElement as HTMLButtonElement).textContent?.trim() === 'First Term');
    const firstTermTableLink = fixture.debugElement
      .queryAll(By.css('.curriculum-content-link'))
      .find((button) => (button.nativeElement as HTMLButtonElement).textContent?.includes('First Term'));
    const detailsButton = fixture.debugElement
      .queryAll(By.css('.curriculum-table-action'))
      .find((button) => button.attributes['aria-label'] === 'Show details for First Term');

    expect((firstTermLabel?.nativeElement as HTMLButtonElement).disabled).toBe(false);
    expect((firstTermTableLink?.nativeElement as HTMLButtonElement).disabled).toBe(false);
    expect((detailsButton?.nativeElement as HTMLAnchorElement).hasAttribute('disabled')).toBe(false);

    firstTermLabel?.triggerEventHandler('click');
    fixture.detectChanges();

    expect(navigate).toHaveBeenCalledWith(['/tenant/university-subjects', 'subject-1', 'curriculum', 'node-1']);
  });

  it('uses the curriculum page as the questions bank subject step before opening questions', async () => {
    await addRootChild('First Term');
    await addChild('node-1', 'Unit 1');
    const router = TestBed.inject(Router);
    const route = TestBed.inject(ActivatedRoute);
    const originalUrlDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(router), 'url');
    const originalSnapshotDescriptor = Object.getOwnPropertyDescriptor(route, 'snapshot');
    Object.defineProperty(router, 'url', {
      configurable: true,
      get: () => '/tenant/questions-bank/basic-education/stage-1/grades/grade-1/subjects/subject-1/curriculum',
    });
    Object.defineProperty(route, 'snapshot', {
      configurable: true,
      value: {
        paramMap: convertToParamMap({ stageId: 'stage-1', gradeId: 'grade-1', id: 'subject-1' }),
      },
    });

    const questionsBankFixture = TestBed.createComponent(TenantSubjectCurriculumComponent);
    questionsBankFixture.detectChanges();
    await questionsBankFixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    questionsBankFixture.detectChanges();
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const firstTermTableLink = questionsBankFixture.debugElement
      .queryAll(By.css('.curriculum-content-link'))
      .find((button) => (button.nativeElement as HTMLButtonElement).textContent?.includes('First Term'));
    const firstTermRow = questionsBankFixture.debugElement
      .queryAll(By.css('.curriculum-content-row'))
      .find((row) => (row.nativeElement as HTMLElement).textContent?.includes('First Term'));
    const actionLabels = questionsBankFixture.debugElement
      .queryAll(By.css('.curriculum-table-action'))
      .map((button) => button.attributes['aria-label']);
    const questionsButton = questionsBankFixture.debugElement
      .queryAll(By.css('.curriculum-table-action'))
      .find((button) => button.attributes['aria-label'] === 'Open questions for First Term');
    const breadcrumbText = (questionsBankFixture.debugElement.query(By.css('.curriculum-page-breadcrumb')).nativeElement as HTMLElement).textContent ?? '';
    const breadcrumbLinks = Array.from(questionsBankFixture.nativeElement.querySelectorAll('.curriculum-page-breadcrumb a'))
      .map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(breadcrumbText).toContain('Questions Bank');
    expect(breadcrumbText).toContain('Basic Education');
    expect(breadcrumbText).toContain('Secondary');
    expect(breadcrumbText).toContain('Grade 10');
    expect(breadcrumbText).toContain('Mathematics');
    expect(breadcrumbText).toContain('Curriculum');
    expect(breadcrumbLinks).toEqual([
      '/tenant/questions-bank',
      '/tenant/questions-bank/basic-education',
      '/tenant/questions-bank/basic-education/stage-1',
      '/tenant/questions-bank/basic-education/stage-1/grades/grade-1',
    ]);
    expect(actionLabels).toEqual(['Open questions for First Term']);
    expect((firstTermRow?.nativeElement as HTMLTableRowElement).getAttribute('role')).toBe('button');
    expect((firstTermRow?.nativeElement as HTMLTableRowElement).getAttribute('tabindex')).toBe('0');
    expect(questionsButton?.injector.get(RouterLink).href).toContain('/tenant/questions-bank/basic-education/stage-1/grades/grade-1/subjects/subject-1/curriculum/node-1');

    firstTermRow?.triggerEventHandler('click');
    questionsBankFixture.detectChanges();

    expect(navigate).not.toHaveBeenCalled();
    expect(questionsBankFixture.componentInstance.selectedNodeId()).toBe('node-1');
    expect((questionsBankFixture.nativeElement.textContent as string)).toContain('Unit 1');

    const unitRow = questionsBankFixture.debugElement
      .queryAll(By.css('.curriculum-content-row'))
      .find((row) => (row.nativeElement as HTMLElement).textContent?.includes('Unit 1'));
    unitRow?.triggerEventHandler('click');
    questionsBankFixture.detectChanges();

    expect(navigate).toHaveBeenCalledWith([
      '/tenant/questions-bank/basic-education',
      'stage-1',
      'grades',
      'grade-1',
      'subjects',
      'subject-1',
      'curriculum',
      'node-2',
    ]);

    navigate.mockClear();
    firstTermTableLink?.triggerEventHandler('click', new MouseEvent('click'));
    questionsBankFixture.detectChanges();

    expect(navigate).not.toHaveBeenCalled();
    expect(questionsBankFixture.componentInstance.selectedNodeId()).toBe('node-1');

    if (originalUrlDescriptor) {
      Object.defineProperty(router, 'url', originalUrlDescriptor);
    }
    if (originalSnapshotDescriptor) {
      Object.defineProperty(route, 'snapshot', originalSnapshotDescriptor);
    } else {
      delete (route as Partial<ActivatedRoute>).snapshot;
    }
  });

  it('renders university question-bank curriculum like the normal university subject curriculum page', async () => {
    await addRootChild('First Term');
    const router = TestBed.inject(Router);
    const route = TestBed.inject(ActivatedRoute);
    const originalUrlDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(router), 'url');
    const originalSnapshotDescriptor = Object.getOwnPropertyDescriptor(route, 'snapshot');
    Object.defineProperty(router, 'url', {
      configurable: true,
      get: () => '/tenant/questions-bank/university-education/colleges/college-1/subjects/subject-1/curriculum',
    });
    Object.defineProperty(route, 'snapshot', {
      configurable: true,
      value: {
        paramMap: convertToParamMap({ collegeId: 'college-1', id: 'subject-1' }),
      },
    });

    const universityQuestionsBankFixture = TestBed.createComponent(TenantSubjectCurriculumComponent);
    universityQuestionsBankFixture.detectChanges();
    await universityQuestionsBankFixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    universityQuestionsBankFixture.detectChanges();

    const breadcrumbText = (universityQuestionsBankFixture.debugElement.query(By.css('.curriculum-page-breadcrumb')).nativeElement as HTMLElement).textContent ?? '';
    const actionLabels = universityQuestionsBankFixture.debugElement
      .queryAll(By.css('.curriculum-table-action'))
      .map((button) => button.attributes['aria-label']);
    const detailsButton = universityQuestionsBankFixture.debugElement
      .queryAll(By.css('.curriculum-table-action'))
      .find((button) => button.attributes['aria-label'] === 'Show details for First Term');
    const questionsButton = universityQuestionsBankFixture.debugElement
      .queryAll(By.css('.curriculum-table-action'))
      .find((button) => button.attributes['aria-label'] === 'Open questions for First Term');

    expect(breadcrumbText).toContain('Questions Bank');
    expect(breadcrumbText).toContain('University Education');
    expect(breadcrumbText).toContain('Grade 10');
    expect(breadcrumbText).toContain('Mathematics');
    expect(breadcrumbText).toContain('Curriculum');
    expect(actionLabels).toEqual(['Open questions for First Term']);
    expect(detailsButton).toBeUndefined();
    expect(questionsButton?.injector.get(RouterLink).href).toContain('/tenant/questions-bank/university-education/colleges/college-1/subjects/subject-1/curriculum/node-1');

    if (originalUrlDescriptor) {
      Object.defineProperty(router, 'url', originalUrlDescriptor);
    }
    if (originalSnapshotDescriptor) {
      Object.defineProperty(route, 'snapshot', originalSnapshotDescriptor);
    } else {
      delete (route as Partial<ActivatedRoute>).snapshot;
    }
  });

  it('renders the selected curriculum node direct children in the content table', async () => {
    await addRootChild('First Term');
    await addRootChild('Second Term');
    await addChild('node-1', 'Unit 1');
    await addChild('node-1', 'Unit 2');
    let tableRows = fixture.debugElement.queryAll(By.css('tbody tr'));

    expect(tableRows.length).toBe(2);
    expect((tableRows[0].nativeElement as HTMLElement).textContent).toContain('First Term');
    expect((tableRows[1].nativeElement as HTMLElement).textContent).toContain('Second Term');
    expect((tableRows[0].nativeElement as HTMLElement).textContent).not.toContain('Unit 1');

    const firstTermTableLink = fixture.debugElement
      .queryAll(By.css('.curriculum-content-link'))
      .find((button) => (button.nativeElement as HTMLElement).textContent?.includes('First Term'));

    expect(firstTermTableLink).toBeDefined();
    firstTermTableLink?.triggerEventHandler('click', new MouseEvent('click'));
    fixture.detectChanges();

    tableRows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(fixture.componentInstance.selectedNodeId()).toBe('node-1');
    expect(tableRows.length).toBe(2);
    expect((tableRows[0].nativeElement as HTMLElement).textContent).toContain('Unit 1');
    expect((tableRows[1].nativeElement as HTMLElement).textContent).toContain('Unit 2');
    expect((tableRows[0].nativeElement as HTMLElement).textContent).not.toContain('First Term');
  });

  it('renders curriculum table material, questions, and delete actions', async () => {
    await addRootChild('First Term');
    const actionButtons = fixture.debugElement.queryAll(By.css('.curriculum-table-action'));
    const actionLabels = actionButtons.map((button) => button.attributes['aria-label']);
    const actionIconText = fixture.debugElement
      .queryAll(By.css('.curriculum-table-action mat-icon'))
      .map((icon) => (icon.nativeElement as HTMLElement).textContent?.trim());
    const actionTooltips = fixture.debugElement
      .queryAll(By.css('.curriculum-action-tooltip'))
      .map((tooltip) => (tooltip.nativeElement as HTMLElement).textContent?.trim());

    expect(actionLabels).toContain('Add sub under First Term');
    expect(actionLabels).toContain('Show details for First Term');
    expect(actionLabels).toContain('Edit First Term');
    expect(actionLabels).toContain('Open materials for First Term');
    expect(actionLabels).toContain('Open questions for First Term');
    expect(actionLabels).toContain('Delete First Term');
    expect(actionIconText).toContain('add');
    expect(actionIconText).toContain('visibility');
    expect(actionIconText).toContain('edit');
    expect(actionIconText).toContain('menu_book');
    expect(actionIconText).toContain('quiz');
    expect(actionIconText).toContain('delete');
    expect(actionTooltips).toContain('Add sub');
    expect(actionTooltips).toContain('Details');
    expect(actionTooltips).toContain('Edit');
    expect(actionTooltips).toContain('Materials');
    expect(actionTooltips).toContain('Questions');
    expect(actionTooltips).toContain('Delete');
  });

  it('translates curriculum table action tooltips in RTL', async () => {
    await addRootChild('First Term');
    i18n.language.set('ar');
    fixture.detectChanges();
    const actionTooltips = fixture.debugElement
      .queryAll(By.css('.curriculum-action-tooltip'))
      .map((tooltip) => (tooltip.nativeElement as HTMLElement).textContent?.trim());

    expect(actionTooltips).toContain('التفاصيل');
    expect(actionTooltips).toContain('تعديل');
    expect(actionTooltips).toContain('الملحقات');
    expect(actionTooltips).toContain('الأسئلة');
    expect(actionTooltips).toContain('حذف');
    expect(actionTooltips).not.toContain('Details');
    expect(actionTooltips).not.toContain('Edit');
    expect(actionTooltips).not.toContain('Materials');
    expect(actionTooltips).not.toContain('Questions');
    expect(actionTooltips).not.toContain('Delete');
  });

  it('routes to curriculum item details from the table action', async () => {
    await addRootChild('First Term');
    const detailsButton = fixture.debugElement
      .queryAll(By.css('.curriculum-table-action'))
      .find((button) => button.attributes['aria-label'] === 'Show details for First Term');

    expect(detailsButton).toBeDefined();
    const routerLink = detailsButton?.injector.get(RouterLink);
    expect(routerLink?.href).toContain('/tenant/subjects/subject-1/curriculum/node-1');
  });

  it('routes to the curriculum item material tab from the materials action', async () => {
    await addRootChild('First Term');
    const materialsButton = fixture.debugElement
      .queryAll(By.css('.curriculum-table-action'))
      .find((button) => button.attributes['aria-label'] === 'Open materials for First Term');

    expect(materialsButton).toBeDefined();
    const routerLink = materialsButton?.injector.get(RouterLink);
    expect(routerLink?.href).toContain('/tenant/subjects/subject-1/curriculum/node-1');
    expect(routerLink?.href).toContain('tab=material');
  });

  it('routes to add a question from the questions action', async () => {
    await addRootChild('First Term');
    const questionsButton = fixture.debugElement
      .queryAll(By.css('.curriculum-table-action'))
      .find((button) => button.attributes['aria-label'] === 'Open questions for First Term');

    expect(questionsButton).toBeDefined();
    const routerLink = questionsButton?.injector.get(RouterLink);
    expect(routerLink?.href).toContain('/tenant/subjects/subject-1/curriculum/node-1/addQuestion');
  });

  it('opens a confirmation modal before deleting a curriculum table item', async () => {
    await addRootChild('First Term');
    await addRootChild('Second Term');
    const deleteButton = fixture.debugElement
      .queryAll(By.css('.curriculum-table-action--danger'))
      .find((button) => button.attributes['aria-label'] === 'Delete First Term');

    expect(deleteButton).toBeDefined();
    deleteButton?.triggerEventHandler('click');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Delete curriculum item');
    expect(fixture.nativeElement.textContent).toContain('Delete "First Term"?');
    expect(data.deleteSubjectCurriculumNode).not.toHaveBeenCalled();

    const confirmButton = fixture.debugElement.query(By.css('.curriculum-modal-danger'));
    expect((confirmButton.nativeElement as HTMLButtonElement).disabled).toBe(false);
    confirmButton.triggerEventHandler('click');
    await fixture.whenStable();
    fixture.detectChanges();

    const tableRows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(tableRows.length).toBe(1);
    expect((tableRows[0].nativeElement as HTMLElement).textContent).toContain('Second Term');
    expect(fixture.nativeElement.textContent).not.toContain('First Term');
    expect(fixture.componentInstance.deleteNodeModal()).toBeNull();
    expect(data.deleteSubjectCurriculumNode).toHaveBeenCalledWith('subject-1', 'node-1');
  });

  it('blocks curriculum item deletion when the item has inner content', async () => {
    await addRootChild('First Term');
    await addChild('node-1', 'Unit 1');
    const deleteButton = fixture.debugElement
      .queryAll(By.css('.curriculum-table-action--danger'))
      .find((button) => button.attributes['aria-label'] === 'Delete First Term');

    expect(deleteButton).toBeDefined();
    deleteButton?.triggerEventHandler('click');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('This item cannot be deleted because it has inner content.');
    const confirmButton = fixture.debugElement.query(By.css('.curriculum-modal-danger'));
    expect((confirmButton.nativeElement as HTMLButtonElement).disabled).toBe(true);
    confirmButton.triggerEventHandler('click');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(data.deleteSubjectCurriculumNode).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('First Term');
    expect(fixture.componentInstance.curriculumTree()[0].children[0].children[0].label).toBe('Unit 1');
  });

  it('loads the route subject id on init', () => {
    expect(facade.loadSubject).toHaveBeenCalledWith('subject-1');
    expect(data.getSubjectCurriculum).toHaveBeenCalledWith('subject-1');
  });

  it('collapses and expands tree nodes', async () => {
    await addRootChild('First Term');
    await addChild('node-1', 'Unit 1');
    const component = fixture.componentInstance;
    component.toggleNode('node-1');
    fixture.detectChanges();
    expect(component.isExpanded('node-1')).toBe(true);

    const buttons = fixture.debugElement.queryAll(By.css('.curriculum-tree-toggle:not(.curriculum-tree-toggle--hidden)'));
    buttons[1].triggerEventHandler('click');
    fixture.detectChanges();

    expect(component.isExpanded('node-1')).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('Unit 1');

    buttons[1].triggerEventHandler('click');
    fixture.detectChanges();

    expect(component.isExpanded('node-1')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Unit 1');
  });

  it('adds a sub node under the clicked tree item', async () => {
    const addButtons = fixture.debugElement.queryAll(By.css('.curriculum-tree-action[aria-label^="Add sub under"]'));
    addButtons[0].triggerEventHandler('click');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Add sub under Mathematics Curriculum');
    fixture.componentInstance.nodeName.set('Algebra');
    fixture.componentInstance.nodeDescription.set('Core algebra lessons');
    fixture.debugElement.query(By.css('.curriculum-modal-primary')).triggerEventHandler('click');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.isExpanded('curriculum')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Algebra');
    expect(data.createSubjectCurriculumNode).toHaveBeenCalledWith('subject-1', {
      parentId: null,
      name: 'Algebra',
      description: 'Core algebra lessons',
    });

    const unitAddButton = fixture.debugElement
      .queryAll(By.css('.curriculum-tree-action[aria-label^="Add sub under"]'))
      .find((button) => button.attributes['aria-label'] === 'Add sub under Algebra');

    expect(unitAddButton).toBeDefined();
    unitAddButton?.triggerEventHandler('click');
    fixture.detectChanges();

    fixture.componentInstance.nodeName.set('Lesson 1');
    fixture.debugElement.query(By.css('.curriculum-modal-primary')).triggerEventHandler('click');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.isExpanded('node-1')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Lesson 1');
  });

  it('renames a tree item from the edit action', async () => {
    await addRootChild('Unit 1');
    const editButton = fixture.debugElement
      .queryAll(By.css('.curriculum-tree-action[aria-label^="Edit"]'))
      .find((button) => button.attributes['aria-label'] === 'Edit Unit 1');

    expect(editButton).toBeDefined();
    editButton?.triggerEventHandler('click');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Edit Unit 1');
    fixture.componentInstance.nodeName.set('Numbers');
    fixture.debugElement.query(By.css('.curriculum-modal-primary')).triggerEventHandler('click');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Numbers');
    expect(fixture.nativeElement.textContent).not.toContain('Unit 1');
    expect(data.updateSubjectCurriculumNode).toHaveBeenCalledWith('subject-1', 'node-1', {
      name: 'Numbers',
      description: null,
    });

    expect(fixture.nativeElement.textContent).not.toContain('Edit Numbers');
  });

  it('translates the edit curriculum item modal in RTL', async () => {
    await addRootChild('Unit 1');
    i18n.language.set('ar');
    fixture.detectChanges();
    const editButton = fixture.debugElement
      .queryAll(By.css('.curriculum-tree-action[aria-label^="Edit"]'))
      .find((button) => button.attributes['aria-label'] === 'Edit Unit 1');

    editButton?.triggerEventHandler('click');
    fixture.detectChanges();

    const modalBackdrop = fixture.debugElement.query(By.css('.curriculum-modal-backdrop')).nativeElement as HTMLElement;
    const nameInput = fixture.debugElement.query(By.css('.curriculum-field input')).nativeElement as HTMLInputElement;
    const descriptionInput = fixture.debugElement.query(By.css('.curriculum-field textarea')).nativeElement as HTMLTextAreaElement;
    const text = fixture.nativeElement.textContent as string;

    expect(modalBackdrop.getAttribute('dir')).toBe('rtl');
    expect(text).toContain('تعديل Unit 1');
    expect(text).toContain('حدد الاسم والوصف الاختياري.');
    expect(text).toContain('الاسم');
    expect(text).toContain('الوصف');
    expect(text).toContain('إلغاء');
    expect(text).toContain('حفظ');
    expect(nameInput.placeholder).toBe('ادخل الاسم');
    expect(descriptionInput.placeholder).toBe('ادخل الوصف');
    expect(text).not.toContain('Set the name and optional description.');
    expect(text).not.toContain('Cancel');
    expect(text).not.toContain('Save');
  });

  async function addRootChild(name: string): Promise<void> {
    await data.createSubjectCurriculumNode('subject-1', { parentId: null, name, description: null });
    fixture.componentInstance.curriculumTreeNodes.set([cloneNode(curriculumRoot)]);
    await settle();
  }

  async function addChild(parentId: string, name: string): Promise<void> {
    await data.createSubjectCurriculumNode('subject-1', { parentId, name, description: null });
    fixture.componentInstance.curriculumTreeNodes.set([cloneNode(curriculumRoot)]);
    await settle();
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }
});
