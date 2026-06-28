import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, provideRouter } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TenantGroupExamCreateFacade } from '../../state/tenant-group-exam-create.facade';
import { TenantGroupExamCreateComponent } from './tenant-group-exam-create.component';

describe('TenantGroupExamCreateComponent', () => {
  let fixture: ComponentFixture<TenantGroupExamCreateComponent>;
  let facade: any;
  const fb = new FormBuilder();
  const examForm = fb.group({
    selectedExamId: [null as string | null],
    title: [{ value: '', disabled: true }],
    date: ['2026-07-01'],
    startTime: [null as string | null],
    duration: [60],
    instructions: [''],
    showResultsImmediately: [false],
    allowRetakes: [false],
  });

  beforeEach(async () => {
    facade = {
      initialize: vi.fn(),
      onDestroy: vi.fn(),
      onCancel: vi.fn(),
      onSubmit: vi.fn(),
      selectPublishedExam: vi.fn(),
      retryExamOptions: vi.fn(),
      setExamSearchQuery: vi.fn(),
      openQuestionPreview: vi.fn(),
      closeQuestionPreview: vi.fn(),
      retryQuestionPreview: vi.fn(),
    } as unknown as TenantGroupExamCreateFacade;
    facade.groupId = signal('group-1');
    facade.isSubmitting = signal(false);
    facade.groupContext = signal({
      id: 'group-1',
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
    facade.isGroupContextLoading = signal(false);
    facade.groupContextError = signal(null);
    facade.publishedExamOptions = signal([
      {
        id: 'exam-1',
        stageId: 'stage-1',
        gradeId: 'grade-1',
        subjectId: 'subject-1',
        title: 'Physics Midterm',
        status: 'PUBLISHED',
        questionCount: 12,
        updatedAt: '2026-06-20T10:00:00Z',
      },
      {
        id: 'exam-2',
        stageId: 'stage-1',
        gradeId: 'grade-1',
        subjectId: 'subject-1',
        title: 'Physics Midterm',
        status: 'PUBLISHED',
        questionCount: 9,
        updatedAt: '2026-06-21T10:00:00Z',
      },
    ]);
    facade.allPublishedExamOptions = facade.publishedExamOptions;
    facade.examSearchQuery = signal('');
    facade.isExamOptionsLoading = signal(false);
    facade.examOptionsError = signal(null);
    facade.previewExam = signal(null);
    facade.previewQuestions = signal([]);
    facade.isPreviewOpen = signal(false);
    facade.isPreviewLoading = signal(false);
    facade.previewError = signal(null);
    facade.examForm = examForm;

    await TestBed.configureTestingModule({
      imports: [TenantGroupExamCreateComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: TenantGroupExamCreateFacade, useValue: facade },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'group-1' }),
              queryParamMap: convertToParamMap({ freshCreate: 'true' }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantGroupExamCreateComponent);
    fixture.detectChanges();
  });

  it('initializes fresh create visits from the quick action query flag', () => {
    expect(facade.initialize).toHaveBeenCalledWith('group-1', true);
  });

  it('renders real group breadcrumbs without placeholder labels', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Physics G12-A');
    expect(text).toContain('Secondary');
    expect(text).toContain('Grade 12');
    expect(text).toContain('Physics');
    expect(text).not.toContain('Create Exam');
  });

  it('keeps exam title read-only and selects published exams from the list', () => {
    const titleInput: HTMLInputElement = fixture.nativeElement.querySelector('#examTitle');
    const options = fixture.nativeElement.querySelectorAll('.exam-option');

    expect(titleInput.disabled || titleInput.readOnly).toBe(true);
    expect(options.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('12 questions');

    fixture.componentInstance.onSelectExam('exam-2');

    expect(facade.selectPublishedExam).toHaveBeenCalledWith(expect.objectContaining({ id: 'exam-2' }));
  });

  it('renders optional start time and searchable Exams section', () => {
    const startTimeInput: HTMLInputElement = fixture.nativeElement.querySelector('#examStartTime');
    const searchInput: HTMLInputElement = fixture.nativeElement.querySelector('.exam-search input');
    const text = fixture.nativeElement.textContent as string;

    expect(startTimeInput.type).toBe('time');
    expect(text).toContain('Exams');
    expect(text).not.toContain('Questions');

    searchInput.value = 'midterm';
    searchInput.dispatchEvent(new Event('input'));

    expect(facade.setExamSearchQuery).toHaveBeenCalledWith('midterm');
  });

  it('does not render removed Save Options controls or Shuffle questions setting', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).not.toContain('Save Options');
    expect(text).not.toContain('Save to Center Question Bank');
    expect(text).not.toContain('Save to My Media');
    expect(text).not.toContain('Shuffle questions');
    expect(fixture.nativeElement.querySelector('[formControlName="saveToCenterBank"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[formControlName="saveToMyMedia"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[formControlName="shuffleQuestions"]')).toBeNull();
    expect(text).toContain('Show results immediately');
    expect(text).toContain('Allow retakes');
  });

  it('opens and closes the full question preview drawer', () => {
    facade.isPreviewOpen.set(true);
    facade.previewExam.set({
      id: 'exam-1',
      title: 'Physics Midterm',
      questionCount: 1,
    });
    facade.previewQuestions.set([
      {
        id: 'question-1',
        question: 'What is velocity?',
        type: 'MCQ',
        answers: [{ answer: 'Speed with direction' }],
      },
    ]);
    fixture.detectChanges();

    const previewButton: HTMLButtonElement = fixture.nativeElement.querySelector('.exam-preview-button');
    previewButton.click();

    expect(facade.openQuestionPreview).toHaveBeenCalledWith(expect.objectContaining({ id: 'exam-1' }));
    expect(fixture.nativeElement.querySelector('.preview-drawer')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('What is velocity?');

    fixture.nativeElement.querySelector('.preview-close-button').click();

    expect(facade.closeQuestionPreview).toHaveBeenCalled();
  });
});
