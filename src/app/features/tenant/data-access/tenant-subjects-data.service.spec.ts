import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { TenantSubjectsDataService } from './tenant-subjects-data.service';

const authApiMock = {
  ensureLoggedIn: vi.fn().mockResolvedValue('token'),
};

describe('TenantSubjectsDataService', () => {
  let service: TenantSubjectsDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    authApiMock.ensureLoggedIn.mockResolvedValue('token');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthApiService, useValue: authApiMock },
      ],
    });

    service = TestBed.inject(TenantSubjectsDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.clearAllMocks();
  });

  it('loads tenant subjects from the backend', async () => {
    const promise = service.listSubjects({ stageId: 'stage-1', gradeId: 'grade-1', search: 'math' });
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/subjects'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('stageId')).toBe('stage-1');
    expect(request.request.params.get('gradeId')).toBe('grade-1');
    expect(request.request.params.get('search')).toBe('math');
    request.flush([subjectResponse()]);

    await expect(promise).resolves.toEqual([subjectResponse()]);
  });

  it('creates tenant subjects through the backend', async () => {
    const promise = service.createSubject({ name: ' Mathematics ', stageId: 'stage-1', gradeId: 'grade-1' });
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/subjects'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Mathematics', stageId: 'stage-1', gradeId: 'grade-1' });
    request.flush(subjectResponse());

    await expect(promise).resolves.toEqual(subjectResponse());
  });

  it('loads subject details and normalizes missing groups and teachers', async () => {
    const promise = service.getSubjectDetails('subject-1');
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/subjects/subject-1'));
    expect(request.request.method).toBe('GET');
    request.flush({ ...subjectResponse(), groups: null, teachers: null });

    await expect(promise).resolves.toEqual({ ...subjectResponse(), groups: [], teachers: [] });
  });

  it('uses the university subject API base for curriculum routes under university subjects', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/tenant/university-subjects/university-subject-1/curriculum');

    const promise = service.getSubjectCurriculum('university-subject-1');
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/university-subjects/university-subject-1/curriculum'));
    expect(request.request.method).toBe('GET');
    request.flush({ id: 'curriculum', label: 'Thermodynamics Curriculum', icon: 'folder', children: [] });

    await expect(promise).resolves.toEqual({
      id: 'curriculum',
      label: 'Thermodynamics Curriculum',
      icon: 'folder',
      description: null,
      children: [],
    });
  });

  it('loads basic-education exam questions from the platform-settings exams API', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/tenant/exams/basic-education/stage-1/grades/grade-1/create/new/subjects/subject-1/curriculum/node-1/addQuestion');

    const promise = service.listBasicEducationExamQuestions('stage-1', 'grade-1', 'subject-1');
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => (
      req.url.endsWith('/tenant/platform-settings/exams/basic-education/stage-1/grades/grade-1/subjects/subject-1/questions')
    ));
    expect(request.request.method).toBe('GET');
    request.flush([questionResponse()]);

    await expect(promise).resolves.toEqual([questionResponse()]);
  });

  it('creates an editable exam-local question copy through the platform-settings exams API', async () => {
    const promise = service.createEditableBasicEducationExamQuestionCopy('stage-1', 'grade-1', 'subject-1', 'exam-1', 'question-1');
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => (
      req.url.endsWith('/tenant/platform-settings/exams/basic-education/stage-1/grades/grade-1/subjects/subject-1/exam-1/questions/question-1/editable-copy')
    ));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush(questionResponse({ id: 'editable-question-1' }));

    await expect(promise).resolves.toEqual(questionResponse({ id: 'editable-question-1' }));
  });

  it('creates basic-education exam questions through the platform-settings exams API', async () => {
    const promise = service.createBasicEducationExamQuestion('stage-1', 'grade-1', 'subject-1', {
      question: ' What is Arabic? ',
      type: 'MULTIPLE_CHOICE',
      answer: null,
      description: null,
      bloomId: null,
      difficultyId: null,
      weight: null,
      skillId: null,
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: null,
      mediaContentType: null,
      mediaSizeBytes: null,
    });
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => (
      req.url.endsWith('/tenant/platform-settings/exams/basic-education/stage-1/grades/grade-1/subjects/subject-1/curriculum/questions')
    ));
    expect(request.request.method).toBe('POST');
    expect(request.request.body['question']).toBe('What is Arabic?');
    request.flush(questionResponse());

    await expect(promise).resolves.toEqual(questionResponse());
  });

  it('loads saved basic-education exams through the platform-settings exams API', async () => {
    const promise = service.listBasicEducationExams('stage-1', 'grade-1', 'subject-1');
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => (
      req.url.endsWith('/tenant/platform-settings/exams/basic-education/stage-1/grades/grade-1/subjects/subject-1')
    ));
    expect(request.request.method).toBe('GET');
    request.flush([examResponse()]);

    await expect(promise).resolves.toEqual([examResponse()]);
  });

  it('requests home work separately from basic-education exams', async () => {
    const promise = service.listBasicEducationExams('stage-1', 'grade-1', 'subject-1', 'HOME_WORK');
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => (
      req.url.endsWith('/tenant/platform-settings/exams/basic-education/stage-1/grades/grade-1/subjects/subject-1')
      && req.params.get('assessmentKind') === 'HOME_WORK'
    ));
    expect(request.request.method).toBe('GET');
    request.flush([examResponse({ assessmentKind: 'HOME_WORK' })]);

    await expect(promise).resolves.toEqual([examResponse({ assessmentKind: 'HOME_WORK' })]);
  });

  it('loads linked questions for a saved basic-education exam', async () => {
    const promise = service.listBasicEducationExamLinkedQuestions('stage-1', 'grade-1', 'subject-1', 'exam-1');
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => (
      req.url.endsWith('/tenant/platform-settings/exams/basic-education/stage-1/grades/grade-1/subjects/subject-1/exam-1/questions')
    ));
    expect(request.request.method).toBe('GET');
    request.flush([questionResponse()]);

    await expect(promise).resolves.toEqual([questionResponse()]);
  });

  it('creates saved basic-education exams through the platform-settings exams API', async () => {
    const promise = service.createBasicEducationExam('stage-1', 'grade-1', 'subject-1', {
      title: ' Midterm ',
      instructions: ' Read carefully ',
      shuffleQuestions: true,
      showResultsImmediately: false,
      allowRetakes: false,
      questionIds: ['question-1'],
    });
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => (
      req.url.endsWith('/tenant/platform-settings/exams/basic-education/stage-1/grades/grade-1/subjects/subject-1')
    ));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      title: 'Midterm',
      instructions: 'Read carefully',
      shuffleQuestions: true,
      showResultsImmediately: false,
      allowRetakes: false,
      questionIds: ['question-1'],
    });
    request.flush(examResponse({ title: 'Midterm' }));

    await expect(promise).resolves.toEqual(examResponse({ title: 'Midterm' }));
  });

  it('updates saved basic-education exam status through the platform-settings exams API', async () => {
    const promise = service.updateBasicEducationExamStatus('stage-1', 'grade-1', 'subject-1', 'exam-1', {
      status: ' PUBLISHED ',
    });
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => (
      req.url.endsWith('/tenant/platform-settings/exams/basic-education/stage-1/grades/grade-1/subjects/subject-1/exam-1/status')
    ));
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'PUBLISHED' });
    request.flush(examResponse({ status: 'PUBLISHED' }));

    await expect(promise).resolves.toEqual(examResponse({ status: 'PUBLISHED' }));
  });

  it('updates saved basic-education exams through the platform-settings exams API', async () => {
    const promise = service.updateBasicEducationExam('stage-1', 'grade-1', 'subject-1', 'exam-1', {
      title: ' Updated Midterm ',
      instructions: ' Updated notes ',
      shuffleQuestions: false,
      showResultsImmediately: true,
      allowRetakes: true,
      questionIds: ['question-1', 'question-2'],
    });
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => (
      req.url.endsWith('/tenant/platform-settings/exams/basic-education/stage-1/grades/grade-1/subjects/subject-1/exam-1')
    ));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      title: 'Updated Midterm',
      instructions: 'Updated notes',
      shuffleQuestions: false,
      showResultsImmediately: true,
      allowRetakes: true,
      questionIds: ['question-1', 'question-2'],
    });
    request.flush(examResponse({ title: 'Updated Midterm' }));

    await expect(promise).resolves.toEqual(examResponse({ title: 'Updated Midterm' }));
  });

  it('deletes saved basic-education exams through the platform-settings exams API', async () => {
    const promise = service.deleteBasicEducationExam('stage-1', 'grade-1', 'subject-1', 'exam-1');
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => (
      req.url.endsWith('/tenant/platform-settings/exams/basic-education/stage-1/grades/grade-1/subjects/subject-1/exam-1')
    ));
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    await expect(promise).resolves.toBeUndefined();
  });

  it('creates basic-education exam question answers through the platform-settings exams API', async () => {
    const promise = service.createBasicEducationExamQuestionAnswer('stage-1', 'grade-1', 'subject-1', 'question-1', {
      answer: ' Answer one ',
      correct: true,
      description: ' First option ',
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: null,
      mediaContentType: null,
      mediaSizeBytes: null,
    });
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => (
      req.url.endsWith('/tenant/platform-settings/exams/basic-education/stage-1/grades/grade-1/subjects/subject-1/curriculum/questions/question-1/answers')
    ));
    expect(request.request.method).toBe('POST');
    expect(request.request.body['answer']).toBe('Answer one');
    expect(request.request.body['description']).toBe('First option');
    request.flush(answerResponse());

    await expect(promise).resolves.toEqual(answerResponse());
  });

  it('updates basic-education exam question answers through the platform-settings exams API', async () => {
    const promise = service.updateBasicEducationExamQuestionAnswer('stage-1', 'grade-1', 'subject-1', 'question-1', 'answer-1', {
      answer: ' Updated answer ',
      correct: false,
      description: ' Updated option ',
    });
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => (
      req.url.endsWith('/tenant/platform-settings/exams/basic-education/stage-1/grades/grade-1/subjects/subject-1/curriculum/questions/question-1/answers/answer-1')
    ));
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body['answer']).toBe('Updated answer');
    expect(request.request.body['correct']).toBe(false);
    expect(request.request.body['description']).toBe('Updated option');
    request.flush(answerResponse({ answer: 'Updated answer', correct: false, description: 'Updated option' }));

    await expect(promise).resolves.toEqual(answerResponse({ answer: 'Updated answer', correct: false, description: 'Updated option' }));
  });

  it('deletes basic-education exam questions through the platform-settings exams API', async () => {
    const promise = service.deleteBasicEducationExamQuestion('stage-1', 'grade-1', 'subject-1', 'question-1');
    await Promise.resolve();

    const request = httpTesting.expectOne((req) => (
      req.url.endsWith('/tenant/platform-settings/exams/basic-education/stage-1/grades/grade-1/subjects/subject-1/curriculum/questions/question-1')
    ));
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    await expect(promise).resolves.toBeUndefined();
  });

  it('loads stage and grade selector options', async () => {
    const stagesPromise = service.listStageOptions();
    await Promise.resolve();
    httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/stages')).flush([
      { id: 'stage-1', name: 'Secondary' },
    ]);

    const gradesPromise = service.listGradeOptions();
    await Promise.resolve();
    httpTesting.expectOne((req) => req.url.endsWith('/tenant/platform-settings/grades')).flush([
      { id: 'grade-1', name: 'Grade 10', stageId: 'stage-1' },
    ]);

    await expect(stagesPromise).resolves.toEqual([{ value: 'stage-1', label: 'Secondary' }]);
    await expect(gradesPromise).resolves.toEqual([{ value: 'grade-1', label: 'Grade 10', stageId: 'stage-1' }]);
  });

  it('maps forbidden errors to a tenant subjects permission message', () => {
    const error = new HttpErrorResponse({ status: 403, error: {} });

    expect(service.toUserMessage(error)).toBe('You do not have permission to manage tenant subjects.');
  });
});

function subjectResponse() {
  return {
    id: 'subject-1',
    name: 'Mathematics',
    stageId: 'stage-1',
    stageName: 'Secondary',
    gradeId: 'grade-1',
    gradeName: 'Grade 10',
    assignedGroupsCount: 0,
    assignedTeachersCount: 0,
    totalStudentsCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    groups: [],
    teachers: [],
  };
}

function examResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'exam-1',
    stageId: 'stage-1',
    gradeId: 'grade-1',
    subjectId: 'subject-1',
    title: 'First Term',
    instructions: null,
    status: 'DRAFT',
    shuffleQuestions: true,
    showResultsImmediately: false,
    allowRetakes: false,
    questionCount: 1,
    createdAt: '2026-06-26T00:00:00Z',
    updatedAt: '2026-06-26T00:00:00Z',
    ...overrides,
  };
}

function questionResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'question-1',
    curriculumNodeId: 'node-1',
    question: 'What is Arabic?',
    type: 'MULTIPLE_CHOICE',
    answer: null,
    description: null,
    mediaUrl: null,
    mediaFileName: null,
    mediaOriginalName: null,
    mediaContentType: null,
    mediaSizeBytes: null,
    bloomId: null,
    difficultyId: null,
    weight: null,
    skillId: null,
    questionSource: null,
    answerExplanation: null,
    tags: [],
    answers: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function answerResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'answer-1',
    answer: 'Answer one',
    correct: true,
    description: 'First option',
    mediaUrl: null,
    mediaFileName: null,
    mediaOriginalName: null,
    mediaContentType: null,
    mediaSizeBytes: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}
