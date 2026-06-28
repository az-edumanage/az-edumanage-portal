import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { TenantGroupExamCreateDataService } from './tenant-group-exam-create-data.service';

describe('TenantGroupExamCreateDataService', () => {
  let service: TenantGroupExamCreateDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TenantGroupExamCreateDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads the saved group exam assignment by group id', () => {
    service.loadGroupExamAssignment('group-1').subscribe((assignment) => {
      expect(assignment.selectedExamId).toBe('exam-1');
      expect(assignment.examTitle).toBe('Physics Midterm');
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/group-1/exam`);
    expect(request.request.method).toBe('GET');
    request.flush({
      groupId: 'group-1',
      selectedExamId: 'exam-1',
      examTitle: 'Physics Midterm',
      date: '2026-07-01',
      startTime: null,
      duration: 60,
      showResultsImmediately: false,
      allowRetakes: false,
    });
  });

  it('saves selected exam assignment without sending an editable title', () => {
    service.saveGroupExamAssignment('group-1', {
      selectedExamId: 'exam-1',
      date: '2026-07-01',
      startTime: null,
      duration: 60,
      instructions: 'Read carefully',
      showResultsImmediately: false,
      allowRetakes: false,
    }).subscribe((assignment) => {
      expect(assignment.examTitle).toBe('Physics Midterm');
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/group-1/exam`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).not.toHaveProperty('title');
    expect(request.request.body).not.toHaveProperty('saveToCenterBank');
    expect(request.request.body).not.toHaveProperty('saveToMyMedia');
    expect(request.request.body).not.toHaveProperty('shuffleQuestions');
    expect(request.request.body.selectedExamId).toBe('exam-1');
    expect(request.request.body.startTime).toBeNull();
    request.flush({
      groupId: 'group-1',
      selectedExamId: 'exam-1',
      examTitle: 'Physics Midterm',
      date: '2026-07-01',
      startTime: null,
      duration: 60,
      showResultsImmediately: false,
      allowRetakes: false,
    });
  });

  it('saves selected exam assignment with a populated start time', () => {
    service.saveGroupExamAssignment('group-1', {
      selectedExamId: 'exam-1',
      date: '2026-07-01',
      startTime: '09:30',
      duration: 60,
      instructions: null,
      showResultsImmediately: false,
      allowRetakes: false,
    }).subscribe((assignment) => {
      expect(assignment.startTime).toBe('09:30');
    });

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/tenant/groups/group-1/exam`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.startTime).toBe('09:30');
    request.flush({
      groupId: 'group-1',
      selectedExamId: 'exam-1',
      examTitle: 'Physics Midterm',
      date: '2026-07-01',
      startTime: '09:30',
      duration: 60,
      showResultsImmediately: false,
      allowRetakes: false,
    });
  });

  it('loads published exam options scoped by stage, grade, and subject', () => {
    service.loadPublishedExamOptions('stage-1', 'grade-1', 'subject-1').subscribe((options) => {
      expect(options).toEqual([
        expect.objectContaining({
          id: 'exam-1',
          title: 'Physics Midterm',
          status: 'PUBLISHED',
          questionCount: 12,
        }),
      ]);
    });

    const request = httpTesting.expectOne((req) =>
      req.url === `${environment.apiBaseUrl}/tenant/platform-settings/exams/basic-education/stage-1/grades/grade-1/subjects/subject-1`
      && req.params.get('status') === 'PUBLISHED',
    );
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'exam-1',
        stageId: 'stage-1',
        gradeId: 'grade-1',
        subjectId: 'subject-1',
        title: 'Physics Midterm',
        status: 'PUBLISHED',
        questionCount: 12,
      },
    ]);
  });

  it('loads exam preview questions from the linked questions endpoint', () => {
    service.loadExamQuestions('stage-1', 'grade-1', 'subject-1', 'exam-1').subscribe((questions) => {
      expect(questions).toEqual([
        expect.objectContaining({
          id: 'question-1',
          question: 'What is velocity?',
          type: 'MCQ',
        }),
      ]);
    });

    const request = httpTesting.expectOne(
      `${environment.apiBaseUrl}/tenant/platform-settings/exams/basic-education/stage-1/grades/grade-1/subjects/subject-1/exam-1/questions`,
    );
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'question-1',
        question: 'What is velocity?',
        type: 'MCQ',
        answers: [],
      },
    ]);
  });
});
