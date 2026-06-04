import { signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { TaskService } from '../../../../core/services/task.service';
import { TenantGroupStudentAddDataService } from '../../data-access/tenant-group-student-add-data.service';
import { TenantGroupStudentAddFacade } from '../../state/tenant-group-student-add.facade';
import { TenantGroupStudentAddStore } from '../../state/tenant-group-student-add.store';
import { TenantGroupStudentAddComponent } from './tenant-group-student-add.component';

describe('TenantGroupStudentAddComponent', () => {
  let fixture: ComponentFixture<TenantGroupStudentAddComponent>;
  let facade: {
    groupId: ReturnType<typeof signal<string | null>>;
    isSubmitting: ReturnType<typeof signal<boolean>>;
    isLoadingCandidates: ReturnType<typeof signal<boolean>>;
    candidateError: ReturnType<typeof signal<string | null>>;
    selectedStudent: ReturnType<typeof signal<unknown>>;
    selectedStudents: ReturnType<typeof signal<{ id: string; name: string; email: string; grade: string }[]>>;
    hasSelectedStudents: ReturnType<typeof signal<boolean>>;
    filteredStudents: ReturnType<typeof signal<{ id: string; name: string; email: string; grade: string }[]>>;
    enrollForm: FormGroup;
    initialize: ReturnType<typeof vi.fn>;
    onDestroy: ReturnType<typeof vi.fn>;
    onSearch: ReturnType<typeof vi.fn>;
    selectStudent: ReturnType<typeof vi.fn>;
    isStudentSelected: ReturnType<typeof vi.fn>;
    onEnroll: ReturnType<typeof vi.fn>;
    onCancel: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const fb = new FormBuilder();
    facade = {
      groupId: signal('group-123'),
      isSubmitting: signal(false),
      isLoadingCandidates: signal(false),
      candidateError: signal(null),
      selectedStudent: signal(null),
      selectedStudents: signal([]),
      hasSelectedStudents: signal(false),
      filteredStudents: signal([
        { id: 'student-1', name: 'Ahmed Ali', email: 'ahmed@example.com', grade: 'Grade 12' },
        { id: 'student-2', name: 'Sara Mohamed', email: 'sara@example.com', grade: 'Grade 12' },
      ]),
      enrollForm: fb.group({
        enrollDate: ['2026-06-02'],
        discount: [0],
        sendNotification: [true],
        generateInitialInvoice: [true],
      }),
      initialize: vi.fn(),
      onDestroy: vi.fn(),
      onSearch: vi.fn(),
      selectStudent: vi.fn(),
      isStudentSelected: vi.fn().mockReturnValue(false),
      onEnroll: vi.fn(),
      onCancel: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TenantGroupStudentAddComponent],
      providers: [
        provideRouter([]),
        { provide: TenantGroupStudentAddFacade, useValue: facade },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'group-123' }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantGroupStudentAddComponent);
    fixture.detectChanges();
  });

  it('initializes eligible-student loading for the route group', () => {
    expect(facade.initialize).toHaveBeenCalledWith('group-123');
  });

  it('keeps existing visible labels and row classes', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(nativeElement.textContent).toContain('Enroll Student in Group');
    expect(nativeElement.textContent).toContain('Find Student');
    expect(nativeElement.textContent).toContain('Enrollment Options');
    expect(nativeElement.textContent).toContain('Confirm Enrollment');
    expect(nativeElement.querySelector('button.w-full.flex.items-center.justify-between.p-3.rounded-lg')).not.toBeNull();
  });

  it('keeps existing route links, option labels, and cancel action visible', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;
    const links = Array.from(nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    const groupsLink = links.find((link) => link.textContent?.includes('Groups'));
    const groupDetailsLink = links.find((link) => link.textContent?.includes('Group Details'));
    const createStudentLink = links.find((link) => link.textContent?.includes('Create New Student'));
    const buttons = Array.from(nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const cancelButton = buttons.find((button) => button.textContent?.includes('Cancel'));

    expect(groupsLink?.getAttribute('href')).toBe('/tenant/groups');
    expect(groupDetailsLink?.getAttribute('href')).toBe('/tenant/groups/group-123');
    expect(createStudentLink?.getAttribute('href')).toBe('/tenant/students/create');
    expect(nativeElement.textContent).toContain('Enrollment Date');
    expect(nativeElement.textContent).toContain('Discount (%)');
    expect(nativeElement.textContent).toContain('Notify student & parent');
    expect(nativeElement.textContent).toContain('Generate initial invoice');
    expect(cancelButton).toBeTruthy();
  });

  it('delegates search over loaded candidates', () => {
    const input = fixture.nativeElement.querySelector('input[placeholder="Search by name, email or ID..."]') as HTMLInputElement;
    input.value = 'sara';
    input.dispatchEvent(new Event('input'));

    expect(facade.onSearch).toHaveBeenCalledWith('sara');
  });

  it('blocks confirmation when no students are selected', () => {
    const confirmButton = fixture.nativeElement.querySelector('button.bg-indigo-600') as HTMLButtonElement;

    expect(confirmButton.disabled).toBe(true);
    confirmButton.click();

    expect(facade.onEnroll).not.toHaveBeenCalled();
  });

  it('renders multiple selected students and submits through the facade', () => {
    facade.hasSelectedStudents.set(true);
    facade.selectedStudents.set([
      { id: 'student-1', name: 'Ahmed Ali', email: 'ahmed@example.com', grade: 'Grade 12' },
      { id: 'student-2', name: 'Sara Mohamed', email: 'sara@example.com', grade: 'Grade 12' },
    ]);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    expect(nativeElement.textContent).toContain('Selected Student');
    expect(nativeElement.textContent).toContain('Ahmed Ali');
    expect(nativeElement.textContent).toContain('Sara Mohamed');

    const confirmButton = nativeElement.querySelector('button.bg-indigo-600') as HTMLButtonElement;
    expect(confirmButton.disabled).toBe(false);
    confirmButton.click();

    expect(facade.onEnroll).toHaveBeenCalled();
  });
});

describe('TenantGroupStudentAddFacade', () => {
  let facade: TenantGroupStudentAddFacade;
  let store: TenantGroupStudentAddStore;
  let enrollmentPayload: unknown;
  let navigationTarget: unknown;

  beforeEach(() => {
    enrollmentPayload = null;
    navigationTarget = null;
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: {
            navigate: (target: unknown) => {
              navigationTarget = target;
              return Promise.resolve(true);
            },
          },
        },
        {
          provide: TaskService,
          useValue: {
            getTask: () => undefined,
            removeTask: () => undefined,
            addTask: () => undefined,
          },
        },
        {
          provide: TenantGroupStudentAddDataService,
          useValue: {
            loadEligibleStudents: () =>
              of([
                { id: 'student-1', name: 'Ahmed Ali', email: 'ahmed@example.com', grade: 'Grade 12' },
                { id: 'student-2', name: 'Sara Mohamed', email: 'sara@example.com', grade: 'Grade 12' },
              ]),
            searchStudents: (query: string, students: { name: string }[]) =>
              students.filter((student) => student.name.toLowerCase().includes(query.toLowerCase())),
            enrollStudentsToGroup: (_groupId: string | null, payload: unknown) => {
              enrollmentPayload = payload;
              return of({
                groupId: 'group-123',
                enrolledStudentIds: ['student-1', 'student-2'],
                skippedStudentIds: [],
              });
            },
          },
        },
      ],
    });

    facade = TestBed.inject(TenantGroupStudentAddFacade);
    store = TestBed.inject(TenantGroupStudentAddStore);
  });

  it('loads backend candidates during initialize and searches loaded candidates', () => {
    facade.initialize('group-123');

    expect(facade.filteredStudents().map((student) => student.id)).toEqual(['student-1', 'student-2']);

    facade.onSearch('sara');

    expect(facade.filteredStudents().map((student) => student.id)).toEqual(['student-2']);
  });

  it('submits multiple selected student ids and navigates to group details', () => {
    facade.initialize('group-123');
    store.setSelectedStudentIds(['student-1', 'student-2']);

    facade.onEnroll();

    expect(enrollmentPayload).toEqual({
      enrollDate: expect.any(String),
      discount: 0,
      sendNotification: true,
      generateInitialInvoice: true,
      studentIds: ['student-1', 'student-2'],
    });
    expect(navigationTarget).toEqual(['/tenant/groups', 'group-123']);
  });
});
