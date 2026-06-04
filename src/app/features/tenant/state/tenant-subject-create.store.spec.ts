import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
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

  beforeEach(() => {
    dataService = {
      listStageOptions: vi.fn().mockResolvedValue([{ value: 'stage-1', label: 'Secondary' }]),
      listGradeOptions: vi.fn().mockResolvedValue([
        { value: 'grade-1', label: 'Grade 10', stageId: 'stage-1' },
        { value: 'grade-2', label: 'Grade 2', stageId: 'stage-2' },
      ]),
      createSubject: vi.fn().mockResolvedValue({ id: 'subject-1' }),
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
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('loads selectors and filters grades by selected stage', async () => {
    await facade.initialize();
    facade.subjectForm.controls.stageId.setValue('stage-1');
    facade.onStageChange('stage-1');

    expect(facade.filteredGrades()).toEqual([{ value: 'grade-1', label: 'Grade 10', stageId: 'stage-1' }]);
  });

  it('creates a subject and navigates back to subjects', async () => {
    await facade.initialize();
    facade.subjectForm.setValue({ stageId: 'stage-1', gradeId: 'grade-1', name: 'Mathematics' });

    await facade.submit();

    expect(dataService.createSubject).toHaveBeenCalledWith({ stageId: 'stage-1', gradeId: 'grade-1', name: 'Mathematics' });
    expect(router.navigate).toHaveBeenCalledWith(['/tenant/subjects']);
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
