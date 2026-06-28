import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TenantCollegesDataService } from '../../data-access/tenant-colleges-data.service';
import { TenantEducationalStagesDataService } from '../../data-access/tenant-educational-stages-data.service';
import { TenantGradesDataService } from '../../data-access/tenant-grades-data.service';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantUniversitiesDataService } from '../../data-access/tenant-universities-data.service';
import { TenantUniversitySubjectsDataService } from '../../data-access/tenant-university-subjects-data.service';
import { TenantExamsComponent } from './tenant-exams.component';

describe('TenantExamsComponent', () => {
  let fixture: ComponentFixture<TenantExamsComponent>;
  const stagesData = { listStages: vi.fn() };
  const gradesData = { listGrades: vi.fn() };
  const subjectsData = { listSubjects: vi.fn(), toUserMessage: vi.fn((_error: unknown, fallback: string) => fallback) };
  const universitiesData = { listUniversities: vi.fn() };
  const collegesData = { listColleges: vi.fn() };
  const universitySubjectsData = { listSubjects: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    stagesData.listStages.mockResolvedValue([
      { id: 'stage-1', name: 'Primary', code: 'PRI', order: 1, status: 'Active', countryId: 'country-1', country: 'Egypt', countryCode: 'EG', gradeCount: 2, classCount: 3, description: null, createdAt: '', updatedAt: '' },
    ]);
    gradesData.listGrades.mockResolvedValue([
      { id: 'grade-1', name: 'Grade One', description: null, level: 'Primary', stageId: 'stage-1', countryId: 'country-1', country: 'Egypt', countryCode: 'EG', studentCount: 24, createdAt: '', updatedAt: '', groups: [] },
      { id: 'grade-2', name: 'Grade Two', description: null, level: 'Primary', stageId: 'stage-1', countryId: 'country-1', country: 'Egypt', countryCode: 'EG', studentCount: 30, createdAt: '', updatedAt: '', groups: [] },
    ]);
    subjectsData.listSubjects.mockResolvedValue([
      { id: 'subject-1', name: 'Math', description: null, stageId: 'stage-1', stageName: 'Primary', gradeId: 'grade-1', gradeName: 'Grade One', totalStudentsCount: 24, assignedGroupsCount: 2, assignedTeachersCount: 1, groups: [], teachers: [], createdAt: '', updatedAt: '' },
    ]);
    universitiesData.listUniversities.mockResolvedValue([
      { id: 'university-1', name: 'Cairo University', code: 'CU', countryId: 'country-1', countryName: 'Egypt', countryCode: 'EG', description: null, status: 'Active', sortOrder: 1, collegeCount: 1, subjectCount: 1, createdAt: '', updatedAt: '' },
    ]);
    collegesData.listColleges.mockResolvedValue([
      { id: 'college-1', universityId: 'university-1', universityName: 'Cairo University', name: 'Engineering', description: null, subjectCount: 1, createdAt: '', updatedAt: '' },
    ]);
    universitySubjectsData.listSubjects.mockResolvedValue([
      { id: 'university-subject-1', universityId: 'university-1', universityName: 'Cairo University', collegeId: 'college-1', collegeName: 'Engineering', name: 'Thermodynamics', description: null, groupCount: 3, studentCount: 40, assignedTeachersCount: 1, teachers: [], createdAt: '', updatedAt: '' },
    ]);

    await TestBed.configureTestingModule({
      imports: [TenantExamsComponent],
      providers: [
        provideRouter([]),
        { provide: TenantEducationalStagesDataService, useValue: stagesData },
        { provide: TenantGradesDataService, useValue: gradesData },
        { provide: TenantSubjectsDataService, useValue: subjectsData },
        { provide: TenantUniversitiesDataService, useValue: universitiesData },
        { provide: TenantCollegesDataService, useValue: collegesData },
        { provide: TenantUniversitySubjectsDataService, useValue: universitySubjectsData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantExamsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  });

  it('renders the two education exam track cards', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Exams');
    expect(text).toContain('Basic Education');
    expect(text).toContain('University Education');
    expect(text).toContain('Education stages');
    expect(text).toContain('Universities');
  });

  it('renders real backend setup metrics and charts', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(stagesData.listStages).toHaveBeenCalled();
    expect(gradesData.listGrades).toHaveBeenCalled();
    expect(subjectsData.listSubjects).toHaveBeenCalled();
    expect(universitiesData.listUniversities).toHaveBeenCalled();
    expect(collegesData.listColleges).toHaveBeenCalled();
    expect(universitySubjectsData.listSubjects).toHaveBeenCalled();
    expect(text).toContain('Exam scopes');
    expect(text).toContain('Subject banks');
    expect(text).toContain('Assigned groups');
    expect(text).toContain('Students covered');
    expect(text).toContain('Track readiness');
    expect(text).toContain('Setup data mix');
    expect(text).toContain('3');
    expect(text).toContain('2');
    expect(text).toContain('5');
    expect(text).toContain('94');
  });

  it('links basic education to the existing education stages route under exams', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(links).toContain('/tenant/exams/basic-education');
  });

  it('links university education to the existing universities route under exams', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(links).toContain('/tenant/exams/university-education');
  });
});
