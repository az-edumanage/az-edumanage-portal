import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TenantTeachersDataService } from '../../data-access/tenant-teachers-data.service';
import { Teacher } from '../../models/tenant-teachers.models';
import { TenantTeacherDetailsComponent } from './tenant-teacher-details.component';

class TenantTeachersDataServiceMock {
  getTeacher = vi.fn(() => of(teacherFixture()));
  exitTeacherGroup = vi.fn(() => of(null));
}

describe('TenantTeacherDetailsComponent', () => {
  let fixture: ComponentFixture<TenantTeacherDetailsComponent>;
  let data: TenantTeachersDataServiceMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantTeacherDetailsComponent],
      providers: [
        provideRouter([]),
        { provide: TenantTeachersDataService, useClass: TenantTeachersDataServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'teacher-1' }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantTeacherDetailsComponent);
    data = TestBed.inject(TenantTeachersDataService) as unknown as TenantTeachersDataServiceMock;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders assigned group links and exit actions', () => {
    const link = fixture.nativeElement.querySelector('.teacher-group-link') as HTMLAnchorElement;
    const button = fixture.nativeElement.querySelector('.teacher-exit-btn') as HTMLButtonElement;

    expect(link.textContent).toContain('Physics G10-A');
    expect(link.getAttribute('href')).toBe('/tenant/groups/group-1');
    expect(button.textContent).toContain('Exit from group');
  });

  it('exits a group and removes it from the table', () => {
    const button = fixture.nativeElement.querySelector('.teacher-exit-btn') as HTMLButtonElement;

    button.click();
    fixture.detectChanges();

    expect(data.exitTeacherGroup).toHaveBeenCalledWith('teacher-1', 'group-1');
    expect(fixture.nativeElement.textContent).not.toContain('Physics G10-A');
    expect(fixture.nativeElement.textContent).toContain('Chemistry G9-B');
  });

  it('filters assigned groups by search text', async () => {
    const component = fixture.componentInstance;

    component.setGroupSearchQuery('biology');
    fixture.detectChanges();
    await fixture.whenStable();

    const groupLinks = Array.from(fixture.nativeElement.querySelectorAll('.teacher-group-link')).map((link) =>
      (link as HTMLAnchorElement).textContent?.trim(),
    );
    expect(groupLinks).toEqual(['Biology G8-C']);
  });

  it('paginates assigned groups', () => {
    const component = fixture.componentInstance;

    expect(fixture.nativeElement.textContent).toContain('1-5 of 6');
    expect(fixture.nativeElement.textContent).not.toContain('History G7-F');

    component.nextGroupPage();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('6-6 of 6');
    expect(fixture.nativeElement.textContent).toContain('History G7-F');
  });
});

function teacherFixture(): Teacher {
  return {
    id: 'teacher-1',
    name: 'Teacher Alpha',
    fullName: 'Teacher Alpha',
    email: 'teacher.alpha@example.com',
    phone: '+20 100 000 0000',
    username: 'teacher.alpha',
    educationCategory: 'BASIC_EDUCATION',
    subject: 'Physics',
    subjects: [],
    universitySubjects: [],
    status: 'Active',
    joinDate: '2026-05-31',
    documents: [],
    stageIds: [],
    gradeIds: [],
    subjectIds: [],
    universityIds: [],
    collegeIds: [],
    universitySubjectIds: [],
    groups: [
      { id: 'group-1', name: 'Physics G10-A', studentsCount: 5 },
      { id: 'group-2', name: 'Chemistry G9-B', studentsCount: 4 },
      { id: 'group-3', name: 'Biology G8-C', studentsCount: 6 },
      { id: 'group-4', name: 'Math G6-D', studentsCount: 7 },
      { id: 'group-5', name: 'Arabic G5-E', studentsCount: 8 },
      { id: 'group-6', name: 'History G7-F', studentsCount: 3 },
    ],
    canManageAttendance: true,
    canManageExams: true,
    canMessageStudents: true,
  };
}
