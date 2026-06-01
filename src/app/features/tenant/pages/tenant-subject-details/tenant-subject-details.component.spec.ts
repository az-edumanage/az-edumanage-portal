import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TenantSubjectDetailsFacade } from '../../state/tenant-subject-details.facade';
import { TenantSubjectDetailsComponent } from './tenant-subject-details.component';

describe('TenantSubjectDetailsComponent', () => {
  let fixture: ComponentFixture<TenantSubjectDetailsComponent>;
  const facade = {
    subject: signal({
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
    loading: signal(false),
    loadError: signal<string | null>(null),
    loadSubject: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantSubjectDetailsComponent],
      providers: [
        provideRouter([]),
        { provide: TenantSubjectDetailsFacade, useValue: facade },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: 'subject-1' })) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantSubjectDetailsComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders metrics and assigned groups table', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Mathematics');
    expect(text).toContain('Assigned Groups');
    expect(text).toContain('Total Students');
    expect(text).toContain('Group A');
    expect(text).toContain('Unassigned');
  });

  it('loads the route subject id on init', () => {
    expect(facade.loadSubject).toHaveBeenCalledWith('subject-1');
  });
});
