import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { GroupDetails, GroupLesson, GroupLessonContent } from '../../models/tenant-group-details.models';
import { TenantGroupDetailsDataService } from '../../data-access/tenant-group-details-data.service';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantGroupLessonDetailsComponent } from './tenant-group-lesson-details.component';

describe('TenantGroupLessonDetailsComponent', () => {
  let fixture: ComponentFixture<TenantGroupLessonDetailsComponent>;
  const unitNodeId = '11111111-1111-4111-8111-111111111111';
  const lessonNodeId = '22222222-2222-4222-8222-222222222222';
  const group: GroupDetails = {
    id: 'group-123',
    name: 'Physics G12-A',
    subjectId: 'subject-1',
    educationCategory: 'BASIC_EDUCATION',
    stageName: 'Secondary',
    gradeName: 'Grade 12',
    subject: 'Physics',
    teacher: 'Sarah Nabil',
    room: 'Lab 101',
    schedule: 'Monday 10:00',
    capacity: 25,
    enrolled: 3,
    fees: 500,
    status: 'Active',
    monthlyRevenue: 1500,
    currency: 'EGP',
    calendarEvents: [
      {
        id: 'group-123:2026-06-20:11:30',
        date: '2026-06-20',
        day: 'Saturday',
        startTime: '11:30',
        endTime: '12:30',
        room: 'Lab 101',
      },
    ],
  };
  const lessons: GroupLesson[] = [
    {
      id: 'group-lesson-1',
      curriculumNodeId: lessonNodeId,
      title: 'Lesson one',
      path: 'Physics Curriculum / Unit one',
      description: 'Intro lesson',
    },
  ];
  const data = {
    loadGroupById: vi.fn(),
    loadGroupLessons: vi.fn(),
    loadGroupLessonContent: vi.fn(),
    addGroupLesson: vi.fn(),
    addGroupLessonContent: vi.fn(),
  };
  const subjectsData = {
    getSubjectCurriculumForCategory: vi.fn(),
    listCurriculumMaterialFolders: vi.fn(),
    listCurriculumMaterialFiles: vi.fn(),
    listCurriculumMaterialNotes: vi.fn(),
    listCurriculumMaterialLinks: vi.fn(),
  };

  beforeEach(async () => {
    data.loadGroupById.mockReset();
    data.loadGroupById.mockReturnValue(of(group));
    data.loadGroupLessons.mockReset();
    data.loadGroupLessons.mockImplementation((_groupId: string, options?: { sessionId?: string | null }) => {
      if (options?.sessionId) {
        return of([
          {
            id: 'assigned-lesson-2',
            curriculumNodeId: '33333333-3333-4333-8333-333333333333',
            title: 'Already assigned lesson',
            path: 'Physics Curriculum / Unit two',
            description: null,
          },
        ] satisfies GroupLesson[]);
      }
      return of(lessons);
    });
    data.loadGroupLessonContent.mockReset();
    data.loadGroupLessonContent.mockReturnValue(of([]));
    data.addGroupLesson.mockReset();
    data.addGroupLesson.mockReturnValue(of({
      id: 'assigned-lesson-1',
      curriculumNodeId: lessonNodeId,
      title: 'Lesson one',
      path: 'Physics Curriculum / Unit one',
      description: 'Intro lesson',
    } satisfies GroupLesson));
    data.addGroupLessonContent.mockReset();
    data.addGroupLessonContent.mockReturnValue(of({
      id: 'content-1',
      curriculumNodeId: unitNodeId,
      curriculumNodeLabel: 'Unit one',
      folderId: 'folder-parent',
      folderName: 'Unit Resources',
      contentType: 'FILE',
      contentId: 'file-parent',
      title: 'unit.pdf',
      url: '/uploads/unit.pdf',
      fileContentType: 'application/pdf',
      sizeBytes: 1024,
    } satisfies GroupLessonContent));
    subjectsData.getSubjectCurriculumForCategory.mockReset();
    subjectsData.getSubjectCurriculumForCategory.mockResolvedValue({
      id: 'curriculum',
      label: 'Physics Curriculum',
      icon: 'folder',
      children: [
        {
          id: unitNodeId,
          label: 'Unit one',
          icon: 'folder',
          children: [
            {
              id: lessonNodeId,
              label: 'Lesson one',
              icon: 'description',
              children: [],
            },
          ],
        },
      ],
    });
    subjectsData.listCurriculumMaterialFolders.mockReset();
    subjectsData.listCurriculumMaterialFolders.mockImplementation(async (_subjectId: string, nodeId: string) => (
      nodeId === lessonNodeId
        ? [{ id: 'folder-1', name: 'Lecture Files', description: null, fileTypes: ['pdf'], filesCount: 1, createdAt: '', updatedAt: '' }]
        : nodeId === unitNodeId
          ? [{ id: 'folder-parent', name: 'Unit Resources', description: null, fileTypes: ['pdf'], filesCount: 1, createdAt: '', updatedAt: '' }]
        : []
    ));
    subjectsData.listCurriculumMaterialFiles.mockReset();
    subjectsData.listCurriculumMaterialFiles.mockResolvedValue([
      { id: 'file-1', url: '/uploads/lesson.pdf', fileName: 'lesson.pdf', originalName: 'lesson.pdf', contentType: 'application/pdf', sizeBytes: 2048, createdAt: '', updatedAt: '' },
    ]);
    subjectsData.listCurriculumMaterialNotes.mockReset();
    subjectsData.listCurriculumMaterialNotes.mockResolvedValue([]);
    subjectsData.listCurriculumMaterialLinks.mockReset();
    subjectsData.listCurriculumMaterialLinks.mockResolvedValue([]);

    await TestBed.configureTestingModule({
      imports: [TenantGroupLessonDetailsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'group-123', lessonId: 'group-lesson-1' }),
              queryParamMap: convertToParamMap({}),
            },
          },
        },
        { provide: TenantGroupDetailsDataService, useValue: data },
        { provide: TenantSubjectsDataService, useValue: subjectsData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantGroupLessonDetailsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  });

  it('renders the selected group lesson details', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(data.loadGroupById).toHaveBeenCalledWith('group-123');
    expect(data.loadGroupLessons).toHaveBeenCalledWith('group-123');
    expect(data.loadGroupLessonContent).toHaveBeenCalledWith('group-123', 'group-lesson-1');
    expect(text).toContain('Physics G12-A');
    expect(text).toContain('Lesson one');
    expect(text).toContain('Physics Curriculum');
    expect(text).toContain('Unit one');
    expect(text).toContain('Intro lesson');
    expect(text).toContain('Physics');
    expect(text).toContain('Education Stage');
    expect(text).toContain('Secondary');
    expect(text).toContain('Grade');
    expect(text).toContain('Grade 12');
    expect(text).toContain('Sarah Nabil');
    expect(text).toContain('Curriculum lesson');
    expect(text).toContain('Quick Actions');
    expect(text).toContain('Insert Content');
    expect(text).toContain('Back to lessons');
    expect(text).toContain('Assign to session');
  });

  it('renders lesson quick actions and opens the assign-to-session drawer', async () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('.tenant-group-lesson-quick-actions a')) as HTMLAnchorElement[];
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.tenant-group-lesson-quick-actions button')) as HTMLButtonElement[];
    const backLink = links.find((link) => link.textContent?.includes('Back to lessons'));
    const assignButton = buttons.find((button) => button.textContent?.includes('Assign to session'));
    const insertButton = buttons.find((button) => button.textContent?.includes('Insert Content'));

    expect(backLink?.getAttribute('href')).toBe('/tenant/groups/group-123?tab=lessons');
    expect(assignButton).toBeTruthy();
    expect(insertButton).toBeTruthy();

    assignButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(data.loadGroupLessons).toHaveBeenCalledWith('group-123', { sync: false, sessionId: 'group-123:2026-06-20:11:30' });
    expect(fixture.nativeElement.textContent).toContain('Physics G12-A sessions');
    expect(fixture.nativeElement.textContent).toContain('Saturday');
    expect(fixture.nativeElement.textContent).toContain('Already assigned lesson');

    insertButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Select material from the parent directory.');
  });

  it('assigns the current lesson when a session is clicked', async () => {
    const assignButton = Array.from(fixture.nativeElement.querySelectorAll('.tenant-group-lesson-quick-actions button'))
      .find((button) => (button as HTMLButtonElement).textContent?.includes('Assign to session')) as HTMLButtonElement;

    assignButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const sessionButton = fixture.debugElement.query(By.css('.tenant-group-lesson-session-card')).nativeElement as HTMLButtonElement;
    sessionButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(data.addGroupLesson).toHaveBeenCalledWith('group-123', lessonNodeId, { sessionId: 'group-123:2026-06-20:11:30' });
    expect(fixture.nativeElement.textContent).toContain('Assigned');
    expect(fixture.nativeElement.textContent).toContain('Lesson one');
  });

  it('auto-displays only direct lesson directory material without adding parent directory material', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(data.loadGroupLessonContent).toHaveBeenCalledWith('group-123', 'group-lesson-1');
    expect(data.addGroupLessonContent).not.toHaveBeenCalled();
    expect(subjectsData.listCurriculumMaterialFolders).not.toHaveBeenCalledWith('subject-1', unitNodeId, 'BASIC_EDUCATION');
    expect(subjectsData.listCurriculumMaterialFiles).toHaveBeenCalledWith('subject-1', lessonNodeId, 'folder-1', 'BASIC_EDUCATION');
    expect(text).toContain('lesson.pdf');
    expect(text).not.toContain('unit.pdf');
    expect(text).toContain('1 available material');
  });

  it('refreshes curriculum material while the lesson page remains open', async () => {
    subjectsData.listCurriculumMaterialFiles.mockResolvedValue([
      { id: 'file-2', url: '/uploads/new-lesson.pdf', fileName: 'new-lesson.pdf', originalName: 'new-lesson.pdf', contentType: 'application/pdf', sizeBytes: 4096, createdAt: '', updatedAt: '' },
    ]);

    await (fixture.componentInstance as unknown as { refreshLessonMaterialContent: () => Promise<void> }).refreshLessonMaterialContent();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('new-lesson.pdf');
  });

  it('opens material selector with parent directory material and inserts selected content into the lesson', async () => {
    const button = fixture.debugElement
      .queryAll(By.css('button.tenant-group-lesson-details-primary'))
      .find((element) => (element.nativeElement.textContent as string).includes('Insert Content'));

    subjectsData.listCurriculumMaterialFiles.mockImplementation(async (_subjectId: string, _nodeId: string, folderId: string) => (
      folderId === 'folder-1'
        ? [{ id: 'file-1', url: '/uploads/lesson.pdf', fileName: 'lesson.pdf', originalName: 'lesson.pdf', contentType: 'application/pdf', sizeBytes: 2048, createdAt: '', updatedAt: '' }]
        : [{ id: 'file-parent', url: '/uploads/unit.pdf', fileName: 'unit.pdf', originalName: 'unit.pdf', contentType: 'application/pdf', sizeBytes: 1024, createdAt: '', updatedAt: '' }]
    ));
    subjectsData.getSubjectCurriculumForCategory.mockClear();
    subjectsData.listCurriculumMaterialFolders.mockClear();
    subjectsData.listCurriculumMaterialFiles.mockClear();
    subjectsData.listCurriculumMaterialNotes.mockClear();
    subjectsData.listCurriculumMaterialLinks.mockClear();

    expect(button).toBeTruthy();
    button?.nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(subjectsData.getSubjectCurriculumForCategory).toHaveBeenCalledWith('subject-1', 'BASIC_EDUCATION');
    expect(subjectsData.listCurriculumMaterialFolders).not.toHaveBeenCalledWith('subject-1', 'curriculum', 'BASIC_EDUCATION');
    expect(subjectsData.listCurriculumMaterialFolders).toHaveBeenCalledWith('subject-1', unitNodeId, 'BASIC_EDUCATION');
    expect(subjectsData.listCurriculumMaterialFolders).not.toHaveBeenCalledWith('subject-1', lessonNodeId, 'BASIC_EDUCATION');
    const modalText = fixture.debugElement.query(By.css('.tenant-group-lesson-modal')).nativeElement.textContent as string;
    expect(modalText).toContain('unit.pdf');
    expect(modalText).not.toContain('lesson.pdf');

    fixture.debugElement.query(By.css('.tenant-group-lesson-material-option')).nativeElement.click();
    fixture.detectChanges();
    fixture.debugElement
      .queryAll(By.css('.tenant-group-lesson-modal-footer button'))
      .find((element) => (element.nativeElement.textContent as string).includes('Insert selected'))
      ?.nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(data.addGroupLessonContent).toHaveBeenCalledWith('group-123', 'group-lesson-1', {
      curriculumNodeId: unitNodeId,
      folderId: 'folder-parent',
      contentType: 'FILE',
      contentId: 'file-parent',
    });
    expect(fixture.nativeElement.textContent).toContain('Lesson material');
    expect(fixture.nativeElement.textContent).not.toContain('Open curriculum');
  });

  it('renders lesson material as a searchable, filterable, paginated table', () => {
    const contentRows: GroupLessonContent[] = Array.from({ length: 6 }, (_, index) => ({
      id: `content-${index + 1}`,
      curriculumNodeId: lessonNodeId,
      curriculumNodeLabel: 'Lesson one',
      folderId: 'folder-1',
      folderName: index === 5 ? 'Reference Links' : 'Lecture Files',
      contentType: index === 5 ? 'LINK' : index === 4 ? 'NOTE' : 'FILE',
      contentId: `material-${index + 1}`,
      title: index === 5 ? 'External reference' : index === 4 ? 'Reading note' : `lesson-${index + 1}.pdf`,
      url: index === 4 ? null : `/uploads/material-${index + 1}`,
      fileContentType: index < 4 ? 'application/pdf' : null,
      sizeBytes: index < 4 ? 2048 : null,
    }));

    fixture.componentInstance.lessonContent.set(contentRows);
    fixture.detectChanges();

    let text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Material');
    expect(text).toContain('Type');
    expect(text).toContain('Folder');
    expect(text).toContain('Source');
    expect(text).toContain('Showing 1-5 of 6 materials');
    expect(text).toContain('lesson-1.pdf');
    expect(text).not.toContain('External reference');

    const nextButton = fixture.debugElement
      .queryAll(By.css('.tenant-group-lesson-material-pagination button'))
      .find((button) => button.nativeElement.getAttribute('aria-label') === 'Next material page');
    nextButton?.nativeElement.click();
    fixture.detectChanges();

    text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Showing 6-6 of 6 materials');
    expect(text).toContain('External reference');

    const searchInput = fixture.debugElement.query(By.css('.tenant-group-lesson-material-search input')).nativeElement as HTMLInputElement;
    searchInput.value = 'reading';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Reading note');
    expect(text).not.toContain('lesson-1.pdf');
    expect(text).toContain('Showing 1-1 of 1 materials');

    fixture.componentInstance.clearContentFilters();
    fixture.detectChanges();
    const filterSelect = fixture.debugElement.query(By.css('.tenant-group-lesson-material-filter select')).nativeElement as HTMLSelectElement;
    filterSelect.value = 'LINK';
    filterSelect.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    text = fixture.nativeElement.textContent as string;
    expect(text).toContain('External reference');
    expect(text).not.toContain('Reading note');
    expect(text).toContain('Showing 1-1 of 1 materials');
  });

  it('previews inserted file content on the same lesson page when the inserted content row is clicked', () => {
    const content: GroupLessonContent = {
      id: 'content-1',
      curriculumNodeId: lessonNodeId,
      curriculumNodeLabel: 'Lesson one',
      folderId: 'folder-1',
      folderName: 'Lecture Files',
      contentType: 'FILE',
      contentId: 'file-1',
      title: 'lesson.pdf',
      url: '/uploads/lesson.pdf',
      fileContentType: 'application/pdf',
      sizeBytes: 2048,
    };

    fixture.componentInstance.lessonContent.set([content]);
    fixture.detectChanges();
    fixture.debugElement.query(By.css('.tenant-group-lesson-content-table-row')).nativeElement.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('lesson.pdf');
    expect(fixture.debugElement.query(By.css('.tenant-group-lesson-file-frame'))).toBeTruthy();
  });

  it('loads and previews inserted note content on the same lesson page', async () => {
    const content: GroupLessonContent = {
      id: 'content-2',
      curriculumNodeId: lessonNodeId,
      curriculumNodeLabel: 'Lesson one',
      folderId: 'folder-1',
      folderName: 'Lecture Files',
      contentType: 'NOTE',
      contentId: 'note-1',
      title: 'Important note',
      url: null,
      fileContentType: null,
      sizeBytes: null,
    };
    subjectsData.listCurriculumMaterialNotes.mockResolvedValue([
      {
        id: 'note-1',
        title: 'Important note',
        contentJson: JSON.stringify({ blocks: [{ type: 'paragraph', data: { text: 'Read chapter one before class.' } }] }),
        createdAt: '',
        updatedAt: '',
      },
    ]);

    fixture.componentInstance.lessonContent.set([content]);
    fixture.detectChanges();
    fixture.debugElement.query(By.css('.tenant-group-lesson-content-table-row')).nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(subjectsData.listCurriculumMaterialNotes).toHaveBeenCalledWith('subject-1', lessonNodeId, 'folder-1', 'BASIC_EDUCATION');
    expect(fixture.nativeElement.textContent).toContain('Read chapter one before class.');
    expect(fixture.debugElement.query(By.css('.tenant-group-lesson-note-preview'))).toBeTruthy();
  });
});
