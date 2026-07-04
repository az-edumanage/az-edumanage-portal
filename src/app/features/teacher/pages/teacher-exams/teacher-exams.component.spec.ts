import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { TeacherApiService } from '../../data-access/teacher-api.service';
import { TeacherExamSetup } from '../../models/teacher.models';
import { TEACHER_ROUTES } from '../../routes';
import { TenantExamsBasicEducationExamCreateComponent } from '../../../tenant/pages/tenant-exams-basic-education-exam-create/tenant-exams-basic-education-exam-create.component';
import { TeacherExamsBasicEducationComponent } from '../teacher-exams-basic-education/teacher-exams-basic-education.component';
import { TeacherExamsBasicEducationGradesComponent } from '../teacher-exams-basic-education-grades/teacher-exams-basic-education-grades.component';
import { TeacherExamsBasicEducationSubjectsComponent } from '../teacher-exams-basic-education-subjects/teacher-exams-basic-education-subjects.component';
import { TeacherExamsUniversityEducationComponent } from '../teacher-exams-university-education/teacher-exams-university-education.component';
import { TeacherExamsUniversityEducationCollegesComponent } from '../teacher-exams-university-education-colleges/teacher-exams-university-education-colleges.component';
import { TeacherExamsUniversityEducationSubjectsComponent } from '../teacher-exams-university-education-subjects/teacher-exams-university-education-subjects.component';
import { TeacherExamsComponent } from './teacher-exams.component';

describe('TeacherExamsComponent', () => {
  let api: { loadExamSetup: () => Observable<TeacherExamSetup[]> };

  function createFixture(scopes: TeacherExamSetup[] = assignedScopes()): ComponentFixture<TeacherExamsComponent> {
    api = { loadExamSetup: () => of(scopes) };
    TestBed.configureTestingModule({
      imports: [TeacherExamsComponent],
      providers: [
        provideRouter([]),
        { provide: TeacherApiService, useValue: api },
      ],
    });

    const fixture = TestBed.createComponent(TeacherExamsComponent);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('routes /teacher/exams to the dedicated page and redirects old grades route', () => {
    const examsRoute = TEACHER_ROUTES.find((candidate) => candidate.path === 'exams');
    const oldGradesRoute = TEACHER_ROUTES.find((candidate) => candidate.path === 'grades');

    expect(examsRoute?.component).toBe(TeacherExamsComponent);
    expect(oldGradesRoute).toMatchObject({ redirectTo: 'exams', pathMatch: 'full' });
  });

  it('routes teacher exam education drill-down pages like tenant exams', () => {
    expect(TEACHER_ROUTES.find((candidate) => candidate.path === 'exams/basic-education')?.component)
      .toBe(TeacherExamsBasicEducationComponent);
    expect(TEACHER_ROUTES.find((candidate) => candidate.path === 'exams/basic-education/:stageId')?.component)
      .toBe(TeacherExamsBasicEducationGradesComponent);
    expect(TEACHER_ROUTES.find((candidate) => candidate.path === 'exams/basic-education/:stageId/grades/:gradeId')?.component)
      .toBe(TeacherExamsBasicEducationSubjectsComponent);
    expect(TEACHER_ROUTES.find((candidate) => candidate.path === 'exams/basic-education/:stageId/grades/:gradeId/create')?.component)
      .toBe(TenantExamsBasicEducationExamCreateComponent);
    expect(TEACHER_ROUTES.find((candidate) => candidate.path === 'exams/basic-education/:stageId/grades/:gradeId/create/new')?.component)
      .toBe(TenantExamsBasicEducationExamCreateComponent);
    expect(TEACHER_ROUTES.find((candidate) => candidate.path === 'exams/university-education')?.component)
      .toBe(TeacherExamsUniversityEducationComponent);
    expect(TEACHER_ROUTES.find((candidate) => candidate.path === 'exams/university-education/:universityId')?.component)
      .toBe(TeacherExamsUniversityEducationCollegesComponent);
    expect(TEACHER_ROUTES.find((candidate) => candidate.path === 'exams/university-education/:universityId/colleges/:collegeId')?.component)
      .toBe(TeacherExamsUniversityEducationSubjectsComponent);
  });

  it('renders tenant-style exam overview using assigned teacher groups only', () => {
    const fixture = createFixture();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Exams');
    expect(text).toContain('Track readiness');
    expect(text).toContain('Setup data mix');
    expect(text).toContain('Live backend data');
    expect(text).toContain('Basic Education');
    expect(text).toContain('University Education');
    expect(text).toContain('Exam scopes');
    expect(text).toContain('Subject banks');
    expect(text).toContain('Assigned groups');
    expect(text).toContain('Students covered');
    expect(text).toContain('2');
    expect(text).toContain('6');
    expect(text).toContain('55');
    expect(text).not.toContain('Tenant');
    expect(text).not.toContain('Teacher scope');
  });

  it('shows only basic education when the teacher has only basic education groups', () => {
    const fixture = createFixture([assignedScopes()[0]]);
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Basic Education');
    expect(text).toContain('Grade 3');
    expect(text).toContain('Math');
    expect(text).not.toContain('University Education');
    expect(text).not.toContain('University setup');
  });

  it('shows only university education when the teacher has only university education groups', () => {
    const fixture = createFixture([assignedScopes()[1]]);
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('University Education');
    expect(text).toContain('Engineering');
    expect(text).toContain('Thermodynamics');
    expect(text).not.toContain('Basic Education');
    expect(text).not.toContain('Basic setup');
  });

  it('links education cards back to assigned teacher groups instead of tenant exam routes', () => {
    const fixture = createFixture();
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(links).toContain('/teacher/exams/basic-education');
    expect(links).toContain('/teacher/exams/university-education');
    expect(links).not.toContain('/teacher/groups');
    expect(links).not.toContain('/tenant/exams/basic-education');
    expect(links).not.toContain('/tenant/exams/university-education');
  });

  it('renders an empty state when the teacher has no assigned groups', () => {
    const fixture = createFixture([]);

    expect(fixture.nativeElement.textContent).toContain('No exam groups assigned');
  });

  it('renders backend errors without showing tenant-wide data', () => {
    api = { loadExamSetup: () => throwError(() => new Error('Teacher exam setup access required')) };
    TestBed.configureTestingModule({
      imports: [TeacherExamsComponent],
      providers: [
        provideRouter([]),
        { provide: TeacherApiService, useValue: api },
      ],
    });

    const fixture = TestBed.createComponent(TeacherExamsComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Teacher exam setup access required');
  });
});

function assignedScopes(): TeacherExamSetup[] {
  return [
    {
      id: 'assignment-1',
      name: 'Grade 3 - Math',
      subject: 'Math',
      educationCategory: 'BASIC_EDUCATION',
      stage: 'Primary',
      grade: 'Grade 3',
      stageId: 'stage-primary',
      gradeId: 'grade-3',
      subjectId: 'subject-math',
      groupsCount: 2,
      studentsCount: 15,
      status: 'Active',
    },
    {
      id: 'assignment-2',
      name: 'Engineering - Thermodynamics',
      subject: 'Thermodynamics',
      educationCategory: 'UNIVERSITY_EDUCATION',
      university: 'Cairo University',
      college: 'Engineering',
      universityId: 'university-1',
      collegeId: 'college-1',
      universitySubjectId: 'university-subject-1',
      groupsCount: 3,
      studentsCount: 40,
      status: 'Active',
    },
  ];
}
