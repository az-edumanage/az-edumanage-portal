import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';
import { TeacherApiService } from '../../data-access/teacher-api.service';
import { TeacherExamSetup } from '../../models/teacher.models';
import { TeacherExamsBasicEducationExamCreateComponent } from './teacher-exams-basic-education-exam-create.component';

async function createFixture(mode?: 'create'): Promise<ComponentFixture<TeacherExamsBasicEducationExamCreateComponent>> {
  TestBed.resetTestingModule();
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
    imports: [TeacherExamsBasicEducationExamCreateComponent],
    providers: [
      provideRouter([]),
      { provide: TeacherApiService, useValue: api },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: mode ? { mode } : {},
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
            queryParamMap: {
              get: (key: string) => (key === 'subjectId' ? 'اللغة العربية' : null),
            },
          },
        },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(TeacherExamsBasicEducationExamCreateComponent);
  fixture.detectChanges();
  return fixture;
}

describe('TeacherExamsBasicEducationExamCreateComponent', () => {
  it('renders the tenant-style grade exams list for the teacher assigned Arabic grade route', async () => {
    const fixture = await createFixture();
    const text = fixture.nativeElement.textContent as string;
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(text).toContain('الصف الأول Exams');
    expect(text).toContain('اللغة العربية');
    expect(text).toContain('Review existing exams for الصف الأول, اللغة العربية.');
    expect(text).toContain('Exams List');
    expect(text).toContain('First Term Exam');
    expect(text).toContain('Monthly Assessment');
    expect(text).toContain('Create Exam');
    expect(text).toContain('ابتدائي');
    expect(text).not.toContain('Thermodynamics');
    expect(links).toContain('/teacher/exams/basic-education/%D8%A7%D8%A8%D8%AA%D8%AF%D8%A7%D8%A6%D9%8A/grades/%D8%A7%D9%84%D8%B5%D9%81%20%D8%A7%D9%84%D8%A3%D9%88%D9%84/create/new');
  });

  it('renders the create form from the same teacher grade context', async () => {
    const fixture = await createFixture('create');
    const text = fixture.nativeElement.textContent as string;
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(text).toContain('Create Exam');
    expect(text).toContain('Exam Title');
    expect(text).toContain('Exam Scope');
    expect(text).toContain('الصف الأول');
    expect(text).toContain('ابتدائي');
    expect(text).toContain('اللغة العربية');
    expect(text).not.toContain('Exams List');
    expect(links).toContain('/teacher/exams/basic-education/%D8%A7%D8%A8%D8%AA%D8%AF%D8%A7%D8%A6%D9%8A/grades/%D8%A7%D9%84%D8%B5%D9%81%20%D8%A7%D9%84%D8%A3%D9%88%D9%84/create');
  });
});
