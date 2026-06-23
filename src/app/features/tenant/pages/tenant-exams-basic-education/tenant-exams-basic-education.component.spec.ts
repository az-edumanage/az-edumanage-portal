import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TenantEducationalStagesDataService } from '../../data-access/tenant-educational-stages-data.service';
import { EducationalStage } from '../../models/tenant-educational-stages.models';
import { TenantExamsBasicEducationComponent } from './tenant-exams-basic-education.component';

const stages: EducationalStage[] = [
  {
    id: 'stage-primary',
    name: 'Primary Stage',
    code: 'PRI',
    order: 1,
    status: 'Active',
    countryId: 'country-eg',
    country: 'Egypt',
    countryCode: 'EG',
    gradeCount: 6,
    classCount: 12,
    description: 'Primary education stage',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

describe('TenantExamsBasicEducationComponent', () => {
  let fixture: ComponentFixture<TenantExamsBasicEducationComponent>;
  let dataService: { listStages: ReturnType<typeof vi.fn>; toUserMessage: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dataService = {
      listStages: vi.fn().mockResolvedValue(stages),
      toUserMessage: vi.fn().mockReturnValue('Unable to load stages.'),
    };

    await TestBed.configureTestingModule({
      imports: [TenantExamsBasicEducationComponent],
      providers: [
        provideRouter([]),
        { provide: TenantEducationalStagesDataService, useValue: dataService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantExamsBasicEducationComponent);
    fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  });

  it('renders breadcrumb and readonly education stage rows', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Exams');
    expect(text).toContain('Basic Education');
    expect(text).toContain('Primary Stage');
    expect(text).toContain('Select an education stage to view its related grades.');
    expect(text).not.toContain('Edit');
    expect(text).not.toContain('Delete');
  });

  it('links a stage row to its exam grades page', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(links).toContain('/tenant/exams/basic-education/stage-primary');
  });
});
