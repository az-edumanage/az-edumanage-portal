import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';
import { TeacherApiService } from '../../data-access/teacher-api.service';
import { TeacherExamSetup } from '../../models/teacher.models';
import { TeacherExamsBasicEducationComponent } from './teacher-exams-basic-education.component';

describe('TeacherExamsBasicEducationComponent', () => {
  let fixture: ComponentFixture<TeacherExamsBasicEducationComponent>;

  beforeEach(() => {
    const api: { loadExamSetup: () => Observable<TeacherExamSetup[]> } = {
      loadExamSetup: () => of([
        { id: 'a1', name: 'Grade 3 - Math', subject: 'Math', educationCategory: 'BASIC_EDUCATION', stageId: 'stage-primary', stage: 'Primary', gradeId: 'grade-3', grade: 'Grade 3', subjectId: 'subject-math', groupsCount: 2, studentsCount: 15, status: 'Active' },
        { id: 'a3', name: 'الصف الأول - اللغة العربية', subject: 'اللغة العربية', educationCategory: 'BASIC_EDUCATION', stage: 'ابتدائي', grade: 'الصف الأول', groupsCount: 0, studentsCount: 0, status: 'Pending' },
        { id: 'a2', name: 'Engineering - Thermodynamics', subject: 'Thermodynamics', educationCategory: 'UNIVERSITY_EDUCATION', universityId: 'university-1', university: 'Cairo University', collegeId: 'college-1', college: 'Engineering', universitySubjectId: 'university-subject-1', groupsCount: 3, studentsCount: 40, status: 'Active' },
      ]),
    };

    TestBed.configureTestingModule({
      imports: [TeacherExamsBasicEducationComponent],
      providers: [provideRouter([]), { provide: TeacherApiService, useValue: api }],
    });
    fixture = TestBed.createComponent(TeacherExamsBasicEducationComponent);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('lists only assigned basic education stages and links to teacher grades route', () => {
    const text = fixture.nativeElement.textContent as string;
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(text).toContain('Basic Education');
    expect(text).toContain('Primary');
    expect(text).toContain('ابتدائي');
    expect(text).toContain('Teacher Link');
    expect(text).toContain('Linked to teacher');
    expect(text).toContain('Classes');
    expect(text).toContain('2');
    expect(text).not.toContain('Cairo University');
    expect(links).toContain('/teacher/exams/basic-education/stage-primary');
    expect(links).toContain('/teacher/exams/basic-education/%D8%A7%D8%A8%D8%AA%D8%AF%D8%A7%D8%A6%D9%8A');
  });
});
