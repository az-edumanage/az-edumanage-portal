import { TestBed } from '@angular/core/testing';
import { TenantGradesDataService } from '../data-access/tenant-grades-data.service';
import { Grade } from '../models/tenant-grades.models';
import { TenantGradesStore } from './tenant-grades.store';

describe('TenantGradesStore', () => {
  let store: TenantGradesStore;
  let dataService: {
    listGrades: ReturnType<typeof vi.fn>;
    deleteGrade: ReturnType<typeof vi.fn>;
    toUserMessage: ReturnType<typeof vi.fn>;
    toDeleteUserMessage: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dataService = {
      listGrades: vi.fn().mockResolvedValue(sampleGrades()),
      deleteGrade: vi.fn().mockResolvedValue(undefined),
      toUserMessage: vi.fn().mockReturnValue('Unable to load grades'),
      toDeleteUserMessage: vi.fn().mockReturnValue('Unable to delete grade'),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: TenantGradesDataService, useValue: dataService },
      ],
    });
    store = TestBed.inject(TenantGradesStore);
  });

  it('loads grades from backend data', async () => {
    await store.loadGrades();

    expect(store.grades()).toEqual(sampleGrades());
    expect(dataService.listGrades).toHaveBeenCalled();
  });

  it('filters grades by level and minimum students', async () => {
    await store.loadGrades();
    store.levelFilter.set('Primary');
    store.minStudentsFilter.set(5);

    const filtered = store.filteredGrades();

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Primary 2');
  });

  it('sorts real rows by student count ascending', async () => {
    await store.loadGrades();
    store.sortBy.set('students-asc');

    const filtered = store.filteredGrades();

    expect(filtered[0].studentCount).toBe(0);
  });

  it('stores a user-facing load error without mock fallback rows', async () => {
    dataService.listGrades.mockRejectedValueOnce(new Error('Forbidden'));

    await store.loadGrades();

    expect(store.grades()).toEqual([]);
    expect(store.loadError()).toBe('Unable to load grades');
  });

  it('opens and cancels delete confirmation state', () => {
    const grade = sampleGrades()[0];

    store.openDeleteConfirmation(grade);

    expect(store.deleteState().status).toBe('confirming');
    expect(store.deleteState().grade).toEqual(grade);

    store.cancelDelete();

    expect(store.deleteState()).toEqual({ grade: null, status: 'closed', message: null });
  });

  it('deletes a confirmed grade and removes it from visible state', async () => {
    await store.loadGrades();
    store.openDeleteConfirmation(sampleGrades()[0]);

    await store.confirmDelete();

    expect(dataService.deleteGrade).toHaveBeenCalledWith('grade-secondary');
    expect(store.grades().map((grade) => grade.id)).toEqual(['grade-primary']);
    expect(store.deleteState().status).toBe('success');
    expect(store.deleteState().message).toBe('Grade "Grade 10" was deleted successfully.');
  });

  it('keeps a grade visible and shows failure when delete fails', async () => {
    dataService.deleteGrade.mockRejectedValueOnce(new Error('Blocked'));
    await store.loadGrades();
    store.openDeleteConfirmation(sampleGrades()[0]);

    await store.confirmDelete();

    expect(store.grades().map((grade) => grade.id)).toEqual(['grade-secondary', 'grade-primary']);
    expect(store.deleteState().status).toBe('failed');
    expect(store.deleteState().message).toBe('Unable to delete grade');
  });
});

function sampleGrades(): Grade[] {
  return [
    grade({ id: 'grade-secondary', name: 'Grade 10', level: 'Secondary', stageId: 'stage-secondary', studentCount: 0 }),
    grade({ id: 'grade-primary', name: 'Primary 2', level: 'Primary', stageId: 'stage-primary', studentCount: 12 }),
  ];
}

function grade(overrides: Partial<Grade> = {}): Grade {
  return {
    id: 'grade-1',
    name: 'Grade 10',
    description: 'Description',
    level: 'Secondary',
    stageId: 'stage-1',
    countryId: 'country-1',
    country: 'Egypt',
    countryCode: 'EG',
    studentCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    groups: [],
    ...overrides,
  };
}
