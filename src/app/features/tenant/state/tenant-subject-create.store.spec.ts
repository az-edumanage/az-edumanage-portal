import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TaskService } from '../../../core/services/task.service';
import { TenantSubjectsDataService } from '../data-access/tenant-subjects-data.service';
import { TenantSubjectCreateFacade } from './tenant-subject-create.facade';

describe('TenantSubjectCreateFacade', () => {
  let facade: TenantSubjectCreateFacade;
  let dataService: {
    listStageOptions: ReturnType<typeof vi.fn>;
    listGradeOptions: ReturnType<typeof vi.fn>;
    createSubject: ReturnType<typeof vi.fn>;
    toUserMessage: ReturnType<typeof vi.fn>;
  };
  let router: Router;
  let taskService: TaskService;

  beforeEach(() => {
    dataService = {
      listStageOptions: vi.fn().mockResolvedValue([{ value: 'stage-1', label: 'Secondary' }]),
      listGradeOptions: vi.fn().mockResolvedValue([
        { value: 'grade-1', label: 'Grade 10', stageId: 'stage-1' },
        { value: 'grade-2', label: 'Grade 2', stageId: 'stage-2' },
      ]),
      createSubject: vi.fn().mockResolvedValue({
        id: 'subject-1',
        name: 'Mathematics',
        stageId: 'stage-1',
        gradeId: 'grade-1',
      }),
      toUserMessage: vi.fn().mockReturnValue('Unable to save subject'),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: TenantSubjectsDataService, useValue: dataService },
      ],
    });
    facade = TestBed.inject(TenantSubjectCreateFacade);
    router = TestBed.inject(Router);
    taskService = TestBed.inject(TaskService);
    vi.spyOn(taskService, 'addTask');
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  it('loads selectors and filters grades by selected stage', async () => {
    await facade.initialize();
    facade.subjectForm.controls.stageId.setValue('stage-1');
    facade.onStageChange('stage-1');

    expect(facade.filteredGrades()).toEqual([{ value: 'grade-1', label: 'Grade 10', stageId: 'stage-1' }]);
  });

  it('preselects stage and grade when opened from the group form', async () => {
    await facade.initialize('/tenant/groups/create', 'stage-1', 'grade-1');

    expect(facade.subjectForm.controls.stageId.value).toBe('stage-1');
    expect(facade.subjectForm.controls.gradeId.value).toBe('grade-1');
    expect(facade.filteredGrades()).toEqual([{ value: 'grade-1', label: 'Grade 10', stageId: 'stage-1' }]);
  });

  it('creates a subject and navigates back to subjects', async () => {
    await facade.initialize();
    facade.subjectForm.setValue({ stageId: 'stage-1', gradeId: 'grade-1', name: 'Mathematics' });

    await facade.submit();

    expect(dataService.createSubject).toHaveBeenCalledWith({ stageId: 'stage-1', gradeId: 'grade-1', name: 'Mathematics' });
    expect(router.navigate).toHaveBeenCalledWith(['/tenant/subjects']);
  });

  it('returns to group create after saving when opened from the group form', async () => {
    await facade.initialize('/tenant/groups/create');
    facade.subjectForm.setValue({ stageId: 'stage-1', gradeId: 'grade-1', name: 'Mathematics' });

    await facade.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/tenant/groups/create');
    expect(taskService.addTask).toHaveBeenCalledWith(expect.objectContaining({
      id: 'create-group-pending-subject',
      route: '/tenant/groups/create',
      data: { id: 'subject-1', name: 'Mathematics', stageId: 'stage-1', gradeId: 'grade-1' },
    }));
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('returns to group create after cancel when opened from the group form', async () => {
    await facade.initialize('/tenant/groups/create', 'stage-1', 'grade-1');

    await facade.cancel();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/tenant/groups/create');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('keeps the form open and shows backend validation errors', async () => {
    dataService.createSubject.mockRejectedValueOnce(new Error('Duplicate'));
    await facade.initialize();
    facade.subjectForm.setValue({ stageId: 'stage-1', gradeId: 'grade-1', name: 'Mathematics' });

    await facade.submit();

    expect(facade.saveError()).toBe('Unable to save subject');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
