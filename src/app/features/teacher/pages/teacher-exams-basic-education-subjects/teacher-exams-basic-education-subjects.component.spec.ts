import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';
import { TeacherApiService } from '../../data-access/teacher-api.service';
import { TeacherExamSetup } from '../../models/teacher.models';
import { TeacherExamsBasicEducationSubjectsComponent } from './teacher-exams-basic-education-subjects.component';

describe('TeacherExamsBasicEducationSubjectsComponent', () => {
  let fixture: ComponentFixture<TeacherExamsBasicEducationSubjectsComponent>;

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
          id: 'assignment-other-grade',
          name: 'الصف الثاني - الرياضيات',
          subject: 'الرياضيات',
          educationCategory: 'BASIC_EDUCATION',
          stage: 'ابتدائي',
          grade: 'الصف الثاني',
          groupsCount: 1,
          studentsCount: 12,
          status: 'Active',
        },
      ]),
    };

    await TestBed.configureTestingModule({
      imports: [TeacherExamsBasicEducationSubjectsComponent],
      providers: [
        provideRouter([]),
        { provide: TeacherApiService, useValue: api },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => {
                  if (key === 'stageId') {
                    return 'ابتدائي';
                  }
                  if (key === 'gradeId') {
                    return 'الصف الأول';
                  }
                  return null;
                },
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherExamsBasicEducationSubjectsComponent);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('lists related subjects for the selected teacher grade route', () => {
    const text = fixture.nativeElement.textContent as string;
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(text).toContain('ابتدائي');
    expect(text).toContain('الصف الأول');
    expect(text).toContain('اللغة العربية');
    expect(text).toContain('1 subjects');
    expect(text).not.toContain('الرياضيات');
    expect(text).not.toContain('الصف الثاني');
    expect(links).toContain('/teacher/exams/basic-education/%D8%A7%D8%A8%D8%AA%D8%AF%D8%A7%D8%A6%D9%8A/grades/%D8%A7%D9%84%D8%B5%D9%81%20%D8%A7%D9%84%D8%A3%D9%88%D9%84/create');
  });
});
