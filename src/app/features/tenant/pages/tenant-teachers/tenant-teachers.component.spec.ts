import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TenantTeachersDataService } from '../../data-access/tenant-teachers-data.service';
import { Teacher } from '../../models/tenant-teachers.models';
import { TenantTeachersComponent } from './tenant-teachers.component';

describe('TenantTeachersComponent', () => {
  let fixture: ComponentFixture<TenantTeachersComponent>;
  let data: {
    listTeachers: ReturnType<typeof vi.fn>;
    statusSummary: ReturnType<typeof vi.fn>;
    capacity: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    data = {
      listTeachers: vi.fn(),
      statusSummary: vi.fn(),
      capacity: vi.fn(),
    };
    data.listTeachers.mockReturnValue(of([
      teacherFixture('teacher-1', 'Dr. Ahmed Zewail'),
      teacherFixture('teacher-2', 'Mona Helmy'),
    ]));
    data.statusSummary.mockReturnValue(of({
      totalTeachers: 2,
      inGroupNow: 1,
      absenceTeachers: 1,
      inGroupNowTeacherIds: ['teacher-1'],
      absenceTeacherIds: ['teacher-2'],
      today: '2026-06-29',
      asOf: '2026-06-29T13:30:00+03:00',
      unavailableReason: null,
    }));
    data.capacity.mockReturnValue(of({
      tenantType: 'TEACHER',
      currentTeachers: 1,
      maxTeachers: 1,
      canCreate: false,
    }));

    await TestBed.configureTestingModule({
      imports: [TenantTeachersComponent],
      providers: [
        provideRouter([]),
        { provide: TenantTeachersDataService, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantTeachersComponent);
    fixture.detectChanges();
  });

  it('renders teacher status summary cards', () => {
    const text = textContent();

    expect(text).toContain('Total Teachers');
    expect(text).toContain('In Group Now');
    expect(text).toContain('Absence Teachers');
    expect(text).toContain('2');
    expect(text).toContain('1');
  });

  it('filters by card clicks and clears with Total Teachers', () => {
    fixture.componentInstance.selectTeachersInGroupNow();
    fixture.detectChanges();
    expect(fixture.componentInstance.filteredTeachers().map((teacher) => teacher.id)).toEqual(['teacher-1']);

    fixture.componentInstance.selectAbsentTeachers();
    fixture.detectChanges();
    expect(fixture.componentInstance.filteredTeachers().map((teacher) => teacher.id)).toEqual(['teacher-2']);

    fixture.componentInstance.selectAllTeachers();
    fixture.detectChanges();
    expect(fixture.componentInstance.filteredTeachers().map((teacher) => teacher.id)).toEqual(['teacher-1', 'teacher-2']);
  });

  it('shows a dialog when a teacher tenant at its limit clicks Add Teacher', () => {
    const addTeacherButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Add Teacher'));

    expect(addTeacherButton).toBeDefined();
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/tenant/teachers/create"]')).toBeNull();

    addTeacherButton?.click();
    fixture.detectChanges();

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain('Teacher limit reached');
    expect(dialog?.textContent).toContain('This tenant type can have one teacher only.');
  });

  function textContent(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});

function teacherFixture(id: string, name: string): Teacher {
  return {
    id,
    name,
    fullName: name,
    email: `${id}@center.edu`,
    username: id,
    educationCategory: 'BASIC_EDUCATION',
    subject: 'Physics',
    subjects: [{ id: 'subject-1', name: 'Physics', stageId: 'stage-1', gradeId: 'grade-1' }],
    universitySubjects: [],
    status: 'Active',
    joinDate: '2026-05-31',
    documents: [],
    stageIds: ['stage-1'],
    gradeIds: ['grade-1'],
    subjectIds: ['subject-1'],
    universityIds: [],
    collegeIds: [],
    universitySubjectIds: [],
    canManageAttendance: true,
    canManageExams: true,
    canMessageStudents: true,
  };
}
