import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { GradeDetails } from '../../models/tenant-grade-details.models';
import { TenantGradeDetailsFacade } from '../../state/tenant-grade-details.facade';
import { TenantGradeDetailsComponent } from './tenant-grade-details.component';

describe('TenantGradeDetailsComponent', () => {
  let fixture: ComponentFixture<TenantGradeDetailsComponent>;
  let facade: ReturnType<typeof createFacade>;

  beforeEach(async () => {
    facade = createFacade();
    await TestBed.configureTestingModule({
      imports: [TenantGradeDetailsComponent],
      providers: [
        provideRouter([]),
        { provide: TenantGradeDetailsFacade, useValue: facade },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: 'grade-1' })) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantGradeDetailsComponent);
    fixture.detectChanges();
  });

  it('loads the selected grade from the route id', () => {
    expect(facade.loadGrade).toHaveBeenCalledWith('grade-1');
  });

  it('renders existing grade details content with linked groups', () => {
    const text = textContent();

    expect(text).toContain('Grade 10');
    expect(text).toContain('Secondary Level');
    expect(text).toContain('First secondary grade');
    expect(text).toContain('Grade Information');
    expect(text).toContain('Edit Grade');
    expect(text).toContain('Group Name');
    expect(text).toContain('Students');
    expect(text).toContain('Teacher');
    expect(text).toContain('Group A');
  });

  it('renders an empty state when the grade has no linked groups', () => {
    facade.grade.set({
      ...gradeDetails(),
      groups: [],
    });
    fixture.detectChanges();

    expect(textContent()).toContain('No groups are linked to this grade.');
  });

  it('renders a teacher placeholder when no teacher is assigned', () => {
    expect(textContent()).toContain('Unassigned');
  });

  it('keeps loading and error states independent from groups data', () => {
    facade.loading.set(true);
    facade.grade.set(null);
    fixture.detectChanges();
    expect(textContent()).toContain('Loading grade details');

    facade.loading.set(false);
    facade.loadError.set('Grade not found');
    fixture.detectChanges();
    expect(textContent()).toContain('Unable to load grade');
    expect(textContent()).toContain('Back to Grades');
  });

  function textContent(): string {
    return fixture.nativeElement.textContent as string;
  }
});

function createFacade() {
  return {
    grade: signal<GradeDetails | null>(gradeDetails()),
    loading: signal(false),
    loadError: signal<string | null>(null),
    loadGrade: vi.fn().mockResolvedValue(undefined),
  };
}

function gradeDetails() {
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
    groups: [
      { id: 'group-1', name: 'Group A', studentsCount: 0, teacherName: null },
    ],
  };
}
