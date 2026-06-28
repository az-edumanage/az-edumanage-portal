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
  let data: { saveGroupExamAssignment: ReturnType<typeof vi.fn> };
  let taskService: { getTask: ReturnType<typeof vi.fn>; addTask: ReturnType<typeof vi.fn>; removeTask: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    data = {
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
            loadGroupById: vi.fn(),
          },
        },
        { provide: TaskService, useValue: taskService },
      ],
    });

    facade = TestBed.inject(TenantGroupExamCreateFacade);
    TestBed.inject(TenantGroupExamCreateStore).setGroupId('group-1');
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
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

    expect(data.saveGroupExamAssignment).toHaveBeenCalledWith('group-1', {
      selectedExamId: 'exam-1',
      date: '2026-07-01',
      startTime: null,
      duration: 60,
      instructions: 'Read carefully',
      showResultsImmediately: true,
      allowRetakes: false,
    });
    expect(data.saveGroupExamAssignment.mock.calls[0][1]).not.toHaveProperty('saveToCenterBank');
    expect(data.saveGroupExamAssignment.mock.calls[0][1]).not.toHaveProperty('saveToMyMedia');
    expect(data.saveGroupExamAssignment.mock.calls[0][1]).not.toHaveProperty('shuffleQuestions');
  });
});
