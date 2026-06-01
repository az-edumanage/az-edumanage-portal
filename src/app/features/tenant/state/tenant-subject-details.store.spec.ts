import { TestBed } from '@angular/core/testing';
import { TenantSubjectsDataService } from '../data-access/tenant-subjects-data.service';
import { TenantSubjectDetailsStore } from './tenant-subject-details.store';

describe('TenantSubjectDetailsStore', () => {
  let store: TenantSubjectDetailsStore;
  let dataService: {
    getSubjectDetails: ReturnType<typeof vi.fn>;
    toUserMessage: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dataService = {
      getSubjectDetails: vi.fn().mockResolvedValue({
        id: 'subject-1',
        name: 'Mathematics',
        stageId: 'stage-1',
        stageName: 'Secondary',
        gradeId: 'grade-1',
        gradeName: 'Grade 10',
        assignedGroupsCount: 1,
        totalStudentsCount: 0,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        groups: [{ id: 'group-1', name: 'Group A', studentsCount: 0, teacherName: null }],
      }),
      toUserMessage: vi.fn().mockReturnValue('Unable to load subject'),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: TenantSubjectsDataService, useValue: dataService },
      ],
    });
    store = TestBed.inject(TenantSubjectDetailsStore);
  });

  it('loads subject details with assigned groups', async () => {
    await store.loadSubject('subject-1');

    expect(store.subject()?.assignedGroupsCount).toBe(1);
    expect(store.subject()?.groups[0].teacherName).toBeNull();
  });

  it('shows not-found when no id is provided', async () => {
    await store.loadSubject(null);

    expect(store.loadError()).toBe('Subject not found.');
    expect(dataService.getSubjectDetails).not.toHaveBeenCalled();
  });
});
