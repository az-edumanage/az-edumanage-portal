import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { TenantEducationalStagesDataService } from '../../data-access/tenant-educational-stages-data.service';
import { EducationalStage } from '../../models/tenant-educational-stages.models';
import { TenantQuestionsBankBasicEducationComponent } from './tenant-questions-bank-basic-education.component';

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

describe('TenantQuestionsBankBasicEducationComponent', () => {
  let fixture: ComponentFixture<TenantQuestionsBankBasicEducationComponent>;
  let dataService: { listStages: ReturnType<typeof vi.fn>; toUserMessage: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dataService = {
      listStages: vi.fn().mockResolvedValue(stages),
      toUserMessage: vi.fn().mockReturnValue('Unable to load stages.'),
    };

    await TestBed.configureTestingModule({
      imports: [TenantQuestionsBankBasicEducationComponent],
      providers: [
        provideRouter([]),
        { provide: TenantEducationalStagesDataService, useValue: dataService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantQuestionsBankBasicEducationComponent);
    fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  });

  it('renders basic education stages for the questions bank flow', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Questions Bank');
    expect(text).toContain('Basic Education');
    expect(text).toContain('Primary Stage');
    expect(text).toContain('Select an education stage to view its related grades.');
    expect(text).not.toContain('Edit');
    expect(text).not.toContain('Delete');
  });

  it('opens the question bank grades page when a stage row is clicked', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;

    row.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/tenant/questions-bank/basic-education', 'stage-primary']);
  });
});
