import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';
import { TeacherApiService } from '../../data-access/teacher-api.service';
import { TeacherExamSetup } from '../../models/teacher.models';
import { TeacherExamsBasicEducationGradesComponent } from './teacher-exams-basic-education-grades.component';

describe('TeacherExamsBasicEducationGradesComponent', () => {
  let fixture: ComponentFixture<TeacherExamsBasicEducationGradesComponent>;

  beforeEach(async () => {
    const api: { loadExamSetup: () => Observable<TeacherExamSetup[]> } = {
      loadExamSetup: () => of([
        {
          id: 'assignment-arabic',
          name: 'الصف الأول - اللغة العربية',
          subject: 'اللغة العربية',
          educationCategory: 'BASIC_EDUCATION',
          stage: 'ابتدائي',
          grade: 'الصف الأول',
          groupsCount: 0,
          studentsCount: 0,
          status: 'Pending',
        },
        {
          id: 'assignment-university',
          name: 'Engineering - Thermodynamics',
          subject: 'Thermodynamics',
          educationCategory: 'UNIVERSITY_EDUCATION',
          university: 'Cairo University',
          college: 'Engineering',
          groupsCount: 3,
          studentsCount: 40,
          status: 'Active',
        },
      ]),
    };

    await TestBed.configureTestingModule({
      imports: [TeacherExamsBasicEducationGradesComponent],
      providers: [
        provideRouter([]),
        { provide: TeacherApiService, useValue: api },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'stageId' ? 'ابتدائي' : null,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherExamsBasicEducationGradesComponent);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('lists related grades for the selected stage and links grade rows to their exams page', () => {
    const text = fixture.nativeElement.textContent as string;
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(text).toContain('ابتدائي');
    expect(text).toContain('Grades');
    expect(text).toContain('الصف الأول');
    expect(text).toContain('1 subjects');
    expect(text).not.toContain('اللغة العربية');
    expect(text).not.toContain('Thermodynamics');
    expect(links).toContain('/teacher/exams/basic-education/%D8%A7%D8%A8%D8%AA%D8%AF%D8%A7%D8%A6%D9%8A/grades/%D8%A7%D9%84%D8%B5%D9%81%20%D8%A7%D9%84%D8%A3%D9%88%D9%84');
  });
});
