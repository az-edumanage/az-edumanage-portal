import { TestBed } from '@angular/core/testing';
import { TenantSubjectsDataService } from '../data-access/tenant-subjects-data.service';
import { TenantSubject } from '../models/tenant-subjects.models';
import { TenantSubjectsStore } from './tenant-subjects.store';

describe('TenantSubjectsStore', () => {
  let store: TenantSubjectsStore;
  let dataService: {
    listSubjects: ReturnType<typeof vi.fn>;
    toUserMessage: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dataService = {
      listSubjects: vi.fn().mockResolvedValue(sampleSubjects()),
      toUserMessage: vi.fn().mockReturnValue('Unable to load subjects'),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: TenantSubjectsDataService, useValue: dataService },
      ],
    });
    store = TestBed.inject(TenantSubjectsStore);
  });

  it('loads subjects from backend data', async () => {
    await store.loadSubjects();

    expect(store.subjects()).toEqual(sampleSubjects());
    expect(dataService.listSubjects).toHaveBeenCalled();
  });

  it('filters subjects by search, stage, and grade', async () => {
    await store.loadSubjects();
    store.searchQuery.set('math');
    store.stageFilter.set('stage-secondary');
    store.gradeFilter.set('grade-10');

    const filtered = store.filteredSubjects();

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Mathematics');
  });

  it('keeps view mode independent from filters', async () => {
    await store.loadSubjects();
    store.viewMode.set('list');
    store.stageFilter.set('stage-primary');

    expect(store.viewMode()).toBe('list');
    expect(store.filteredSubjects().map((subject) => subject.name)).toEqual(['Science']);
  });

  it('stores load errors without fallback data', async () => {
    dataService.listSubjects.mockRejectedValueOnce(new Error('Forbidden'));

    await store.loadSubjects();

    expect(store.subjects()).toEqual([]);
    expect(store.loadError()).toBe('Unable to load subjects');
  });
});

function sampleSubjects(): TenantSubject[] {
  return [
    subject({
      id: 'subject-math',
      name: 'Mathematics',
      stageId: 'stage-secondary',
      stageName: 'Secondary',
      gradeId: 'grade-10',
      gradeName: 'Grade 10',
      assignedGroupsCount: 2,
    }),
    subject({
      id: 'subject-science',
      name: 'Science',
      stageId: 'stage-primary',
      stageName: 'Primary',
      gradeId: 'grade-2',
      gradeName: 'Grade 2',
      assignedGroupsCount: 0,
    }),
  ];
}

function subject(overrides: Partial<TenantSubject>): TenantSubject {
  return {
    id: 'subject-1',
    name: 'Subject',
    stageId: 'stage-1',
    stageName: 'Stage',
    gradeId: 'grade-1',
    gradeName: 'Grade',
    assignedGroupsCount: 0,
    totalStudentsCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    groups: [],
    ...overrides,
  };
}
