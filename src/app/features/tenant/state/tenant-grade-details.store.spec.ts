import { TestBed } from '@angular/core/testing';
import { TenantGradeDetailsDataService } from '../data-access/tenant-grade-details-data.service';
import { GradeDetails } from '../models/tenant-grade-details.models';
import { TenantGradeDetailsStore } from './tenant-grade-details.store';

describe('TenantGradeDetailsStore', () => {
  let store: TenantGradeDetailsStore;
  let dataService: {
    getGradeById: ReturnType<typeof vi.fn>;
    toUserMessage: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dataService = {
      getGradeById: vi.fn().mockResolvedValue(gradeDetails()),
      toUserMessage: vi.fn().mockReturnValue('Grade not found'),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: TenantGradeDetailsDataService, useValue: dataService },
      ],
    });
    store = TestBed.inject(TenantGradeDetailsStore);
  });

  it('loads real grade details by id', async () => {
    await store.loadGrade('grade-1');

    expect(store.grade()).toEqual(gradeDetails());
    expect(store.loadError()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(dataService.getGradeById).toHaveBeenCalledWith('grade-1');
  });

  it('exposes linked groups from loaded grade details', async () => {
    const group = { id: 'group-1', name: 'Group A', studentsCount: 0, teacherName: null };
    dataService.getGradeById.mockResolvedValueOnce(gradeDetails({ groups: [group] }));

    await store.loadGrade('grade-1');

    expect(store.grade()?.groups).toEqual([group]);
  });

  it('stores a user-facing error when detail loading fails', async () => {
    dataService.getGradeById.mockRejectedValueOnce(new Error('Missing'));

    await store.loadGrade('missing-grade');

    expect(store.grade()).toBeNull();
    expect(store.loadError()).toBe('Grade not found');
    expect(store.loading()).toBe(false);
  });

  it('does not call the backend when the route id is missing', async () => {
    await store.loadGrade(null);

    expect(store.grade()).toBeNull();
    expect(store.loadError()).toBe('Grade not found.');
    expect(dataService.getGradeById).not.toHaveBeenCalled();
  });
});

function gradeDetails(overrides: Partial<GradeDetails> = {}): GradeDetails {
  return {
    id: 'grade-1',
    name: 'Grade 10',
    description: 'First secondary grade',
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
