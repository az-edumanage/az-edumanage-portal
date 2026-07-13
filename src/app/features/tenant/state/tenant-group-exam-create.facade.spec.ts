import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { TenantGroupDetailsDataService } from '../data-access/tenant-group-details-data.service';
import { TenantGroupExamCreateDataService } from '../data-access/tenant-group-exam-create-data.service';
import { TenantGroupExamCreateFacade } from './tenant-group-exam-create.facade';
import { TenantGroupExamCreateStore } from './tenant-group-exam-create.store';

describe('TenantGroupExamCreateFacade', () => {
  let facade: TenantGroupExamCreateFacade;
  let data: {
    saveGroupExamAssignment: ReturnType<typeof vi.fn>;
    loadGroupExamAssignment: ReturnType<typeof vi.fn>;
    loadPublishedExamOptions: ReturnType<typeof vi.fn>;
  };
  let taskService: { getTask: ReturnType<typeof vi.fn>; addTask: ReturnType<typeof vi.fn>; removeTask: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    sessionStorage.clear();
    data = {
      loadGroupExamAssignment: vi.fn().mockReturnValue(of(null)),
      loadPublishedExamOptions: vi.fn().mockReturnValue(of([])),
      saveGroupExamAssignment: vi.fn().mockReturnValue(of({
        groupId: 'group-1',
        selectedExamId: 'exam-1',
        examTitle: 'Physics Midterm',
        date: '2026-07-01',
        startTime: null,
        duration: 60,
        showResultsImmediately: true,
        allowRetakes: false,
      })),
    };
    taskService = {
      getTask: vi.fn(),
      addTask: vi.fn(),
      removeTask: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TenantGroupExamCreateFacade,
        TenantGroupExamCreateStore,
        provideRouter([]),
        { provide: TenantGroupExamCreateDataService, useValue: data },
        {
          provide: TenantGroupDetailsDataService,
          useValue: {
            loadGroupById: vi.fn().mockReturnValue(of({
              id: 'group-1',
              name: 'Science G-5 S-2',
              educationCategory: 'BASIC_EDUCATION',
              stageId: 'stage-1',
              gradeId: 'grade-1',
              subjectId: 'subject-1',
            })),
            loadGroupExams: vi.fn().mockReturnValue(of([])),
          },
        },
        { provide: TaskService, useValue: taskService },
      ],
    });

    facade = TestBed.inject(TenantGroupExamCreateFacade);
    TestBed.inject(TenantGroupExamCreateStore).setGroupId('group-1');
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  it('submits group exam assignment payload without removed options', () => {
    facade.examForm.patchValue({
      selectedExamId: 'exam-1',
      title: 'Physics Midterm',
      date: '2026-07-01',
      startTime: null,
      duration: 60,
      instructions: 'Read carefully',
      showResultsImmediately: true,
      allowRetakes: false,
    });

    facade.onSubmit();

    expect(data.saveGroupExamAssignment).toHaveBeenCalledWith(
      'group-1',
      {
        selectedExamId: 'exam-1',
        date: '2026-07-01',
        startTime: null,
        duration: 60,
        instructions: 'Read carefully',
        showResultsImmediately: true,
        allowRetakes: false,
      },
      { scope: 'tenant' },
    );
    expect(data.saveGroupExamAssignment.mock.calls[0][1]).not.toHaveProperty('saveToCenterBank');
    expect(data.saveGroupExamAssignment.mock.calls[0][1]).not.toHaveProperty('saveToMyMedia');
    expect(data.saveGroupExamAssignment.mock.calls[0][1]).not.toHaveProperty('shuffleQuestions');
  });

  it('does not create a bottom draft task while opening session home work questions', () => {
    facade.initialize('group-1', true, {
      returnTo: '/tenant/groups/group-1/sessions/group-1:2026-07-05:14:00',
      returnTab: 'exams',
      examDate: '2026-07-05',
      examStartTime: '14:00',
    });
    facade.examForm.patchValue({
      selectedExamId: 'exam-1',
      title: 'Science Home Work - 2026-07-05',
      instructions: 'Answer before class',
    });

    facade.onDestroy('/tenant/groups/group-1/exam/basic-education/stage-1/grades/grade-1/subjects/subject-1/curriculum/addQuestion');

    expect(taskService.addTask).not.toHaveBeenCalled();
    expect(taskService.removeTask).toHaveBeenCalledWith('create-exam-group-group-1');
  });

  it('keeps session home work anytime on the selected date when start time is cleared', () => {
    facade.initialize('group-1', true, {
      returnTo: '/tenant/groups/group-1/sessions/group-1:2026-07-06:10:45',
      returnTab: 'exams',
      examDate: '2026-07-06',
      examStartTime: '10:45',
    });
    facade.examForm.patchValue({
      selectedExamId: 'exam-1',
      title: 'Science Home Work - 2026-07-06',
      date: '2026-07-06',
      startTime: null,
      duration: 60,
      instructions: 'Answer before class',
      showResultsImmediately: false,
      allowRetakes: false,
    });

    facade.onSubmit();

    expect(data.saveGroupExamAssignment).toHaveBeenCalledWith(
      'group-1',
      expect.objectContaining({
        selectedExamId: 'exam-1',
        date: '2026-07-06',
        startTime: null,
      }),
      { scope: 'tenant' },
    );
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith(
      '/tenant/groups/group-1/sessions/group-1:2026-07-06:10:45?tab=homeWork',
    );
  });

  it('remembers a successfully assigned session home work row before returning to the session', () => {
    facade.initialize('group-1', true, {
      returnTo: '/tenant/groups/group-1/sessions/group-1:2026-07-06:10:45',
      returnTab: 'exams',
      examDate: '2026-07-06',
      examStartTime: '10:45',
    });
    facade.examForm.patchValue({
      selectedExamId: 'exam-1',
      title: 'Science Home Work - 2026-07-06',
      date: '2026-07-06',
      startTime: '10:45',
      duration: 60,
      instructions: 'Answer before class',
      showResultsImmediately: false,
      allowRetakes: true,
    });

    facade.onSubmit();

    const stored = sessionStorage.getItem(
      'tenant.session-homework.pending.group-1.group-1_2026-07-06_10_45',
    );
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored || '{}')).toEqual(expect.objectContaining({
      groupId: 'group-1',
      examId: 'exam-1',
      title: 'Physics Midterm',
      date: '2026-07-01',
      startTime: null,
      duration: 60,
    }));
  });
});
