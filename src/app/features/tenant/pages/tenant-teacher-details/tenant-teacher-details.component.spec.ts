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
    const link = fixture.nativeElement.querySelector('.tenant-teacher-details-group-link') as HTMLAnchorElement;
    const button = fixture.nativeElement.querySelector('.tenant-teacher-details-exit-btn') as HTMLButtonElement;

    expect(link.textContent).toContain('Physics G10-A');
    expect(link.getAttribute('href')).toBe('/tenant/groups/group-1');
    expect(button.textContent).toContain('Exit from group');
  });

  it('exits a group and removes it from the table', () => {
    const button = fixture.nativeElement.querySelector('.tenant-teacher-details-exit-btn') as HTMLButtonElement;

    button.click();
    fixture.detectChanges();

    expect(data.exitTeacherGroup).toHaveBeenCalledWith('teacher-1', 'group-1');
    expect(fixture.nativeElement.textContent).not.toContain('Physics G10-A');
    expect(fixture.nativeElement.textContent).toContain('No assigned groups yet.');
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
    groups: [{ id: 'group-1', name: 'Physics G10-A', studentsCount: 5 }],
    canManageAttendance: true,
    canManageExams: true,
    canMessageStudents: true,
  };
}
