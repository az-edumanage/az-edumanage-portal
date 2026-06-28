import { TestBed } from '@angular/core/testing';
import { TenantGroupExamCreateStore } from './tenant-group-exam-create.store';

describe('TenantGroupExamCreateStore', () => {
  let store: TenantGroupExamCreateStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantGroupExamCreateStore);
  });

  it('should assign group id and task id together', () => {
    store.setGroupId('g-1');

    expect(store.groupId()).toBe('g-1');
    expect(store.taskId()).toBe('create-exam-group-g-1');
  });

  it('should update submitting state', () => {
    store.setSubmitting(true);
    expect(store.isSubmitting()).toBe(true);
  });

  it('should track group context and recoverable option states', () => {
    store.setGroupContext({
      id: 'g-1',
      name: 'Physics G12-A',
      subjectId: 'subject-1',
      educationCategory: 'BASIC_EDUCATION',
      stageId: 'stage-1',
      stageName: 'Secondary',
      gradeId: 'grade-1',
      gradeName: 'Grade 12',
      subject: 'Physics',
      teacher: '',
      room: '',
      schedule: '',
      capacity: 0,
      enrolled: 0,
      fees: 0,
      status: 'Active',
    });
    store.setPublishedExamOptions([
      {
        id: 'exam-1',
        stageId: 'stage-1',
        gradeId: 'grade-1',
        subjectId: 'subject-1',
        title: 'Midterm',
        status: 'PUBLISHED',
        questionCount: 12,
      },
      {
        id: 'exam-2',
        stageId: 'stage-1',
        gradeId: 'grade-1',
        subjectId: 'subject-1',
        title: 'Final Revision',
        status: 'PUBLISHED',
        questionCount: 8,
      },
    ]);
    store.setExamOptionsError('Retry later');

    expect(store.groupContext()?.stageId).toBe('stage-1');
    expect(store.publishedExamOptions().length).toBe(2);
    expect(store.examOptionsError()).toBe('Retry later');
  });

  it('filters exams by search text without changing selection state', () => {
    store.setPublishedExamOptions([
      {
        id: 'exam-1',
        stageId: 'stage-1',
        gradeId: 'grade-1',
        subjectId: 'subject-1',
        title: 'Physics Midterm',
        status: 'PUBLISHED',
        questionCount: 12,
      },
      {
        id: 'exam-2',
        stageId: 'stage-1',
        gradeId: 'grade-1',
        subjectId: 'subject-1',
        title: 'Chemistry Final',
        status: 'PUBLISHED',
        questionCount: 8,
      },
    ]);

    store.setExamSearchQuery('chem');

    expect(store.filteredExamOptions().map((exam) => exam.id)).toEqual(['exam-2']);

    store.setExamSearchQuery('');

    expect(store.filteredExamOptions().length).toBe(2);
  });

  it('tracks preview open loading success error and close state', () => {
    const exam = {
      id: 'exam-1',
      stageId: 'stage-1',
      gradeId: 'grade-1',
      subjectId: 'subject-1',
      title: 'Physics Midterm',
      status: 'PUBLISHED',
      questionCount: 12,
    };

    store.openPreview(exam);
    store.setPreviewLoading(true);
    store.setPreviewQuestions([{ id: 'q-1', question: 'Question one', type: 'MCQ', answers: [] }]);
    store.setPreviewError('Retry later');

    expect(store.isPreviewOpen()).toBe(true);
    expect(store.previewExam()?.id).toBe('exam-1');
    expect(store.previewQuestions().length).toBe(1);
    expect(store.previewError()).toBe('Retry later');

    store.closePreview();

    expect(store.isPreviewOpen()).toBe(false);
    expect(store.previewExam()).toBeNull();
    expect(store.previewQuestions()).toEqual([]);
  });
});
