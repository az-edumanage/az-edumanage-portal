import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TenantGroupDetailsDataService } from '../../data-access/tenant-group-details-data.service';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { GroupDetails } from '../../models/tenant-group-details.models';
import { TenantGroupStudentAssessmentComponent } from './tenant-group-student-assessment.component';

describe('TenantGroupStudentAssessmentComponent', () => {
  let fixture: ComponentFixture<TenantGroupStudentAssessmentComponent>;

  const group: GroupDetails = {
    id: 'group-123',
    name: 'Science G5-S2',
    subject: 'Science',
    teacher: 'Sarah Nabil',
    room: 'Room 101',
    schedule: 'Friday 03:22',
    capacity: 20,
    enrolled: 1,
    fees: 500,
    status: 'Active',
    students: [
      {
        id: 'student-1',
        name: 'Hussein Mohamed',
        email: 'hussein@example.com',
        barcodeNumber: '777227617820',
        attendanceRate: 80,
        lastAttendance: '',
        attendanceState: 'Absent',
      },
    ],
    calendarEvents: [
      {
        id: 'session-1',
        date: '2026-07-03',
        day: 'Friday',
        startTime: '03:22',
        endTime: '04:22',
        room: 'Room 101',
      },
    ],
  };

  const groupData = {
    loadGroupById: vi.fn(),
    loadStudentAssessment: vi.fn(),
    saveStudentAssessment: vi.fn(),
  };

  const subjectsData = {
    listBloomLevels: vi.fn(),
  };

  beforeEach(async () => {
    groupData.loadGroupById.mockReset();
    groupData.loadGroupById.mockReturnValue(of(group));
    groupData.loadStudentAssessment.mockReset();
    groupData.loadStudentAssessment.mockReturnValue(of({
      groupId: 'group-123',
      sessionId: 'session-1',
      studentId: 'student-1',
      scores: [
        {
          bloomId: 'bloom-remember',
          studentGrade: 6.5,
          finalGrade: 10,
          updatedAt: '2026-07-03T00:00:00Z',
        },
      ],
    }));
    groupData.saveStudentAssessment.mockReset();
    groupData.saveStudentAssessment.mockReturnValue(of({
      groupId: 'group-123',
      sessionId: 'session-1',
      studentId: 'student-1',
      scores: [
        {
          bloomId: 'bloom-remember',
          studentGrade: 7.5,
          finalGrade: 10,
          updatedAt: '2026-07-03T00:00:00Z',
        },
      ],
    }));
    subjectsData.listBloomLevels.mockReset();
    subjectsData.listBloomLevels.mockResolvedValue([
      bloom('bloom-remember', 'remember', 'Remembering', 1),
      bloom('bloom-understand', 'understand', 'Understanding', 2),
      bloom('bloom-apply', 'apply', 'Applying', 3),
      bloom('bloom-analyze', 'analyze', 'Analyzing', 4),
      bloom('bloom-evaluate', 'evaluate', 'Evaluating', 5),
      bloom('bloom-create', 'create', 'Creating', 6),
    ]);

    await TestBed.configureTestingModule({
      imports: [TenantGroupStudentAssessmentComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'group-123', sessionId: 'session-1', studentId: 'student-1' }),
            },
          },
        },
        { provide: TenantGroupDetailsDataService, useValue: groupData },
        { provide: TenantSubjectsDataService, useValue: subjectsData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantGroupStudentAssessmentComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('lists Bloom taxonomy rows with editable student and final grade inputs', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(subjectsData.listBloomLevels).toHaveBeenCalled();
    expect(text).toContain("Bloom's Taxonomy");
    expect(text).toContain("Student's grade");
    expect(text).toContain('Final grade');
    expect(text).toContain('1. Remembering');
    expect(text).toContain('2. Understanding');
    expect(text).toContain('3. Applying');
    expect(text).toContain('4. Analyzing');
    expect(text).toContain('5. Evaluating');
    expect(text).toContain('6. Creating');
    expect(groupData.loadStudentAssessment).toHaveBeenCalledWith('group-123', 'session-1', 'student-1');
    expect(fixture.componentInstance.assessmentScore('bloom-remember', 'studentGrade')).toBe('6.5');

    const studentGradeInput = fixture.nativeElement.querySelector('[aria-label="Student grade for Remembering"]') as HTMLInputElement;
    const finalGradeInput = fixture.nativeElement.querySelector('[aria-label="Final grade for Remembering"]') as HTMLInputElement;

    studentGradeInput.value = '7.5';
    studentGradeInput.dispatchEvent(new Event('input'));
    finalGradeInput.value = '10';
    finalGradeInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.assessmentScore('bloom-remember', 'studentGrade')).toBe('7.5');
    expect(fixture.componentInstance.assessmentScore('bloom-remember', 'finalGrade')).toBe('10');
  });

  it('saves Bloom taxonomy grades for all displayed levels', async () => {
    const studentGradeInput = fixture.nativeElement.querySelector('[aria-label="Student grade for Remembering"]') as HTMLInputElement;
    const finalGradeInput = fixture.nativeElement.querySelector('[aria-label="Final grade for Remembering"]') as HTMLInputElement;
    studentGradeInput.value = '7.5';
    studentGradeInput.dispatchEvent(new Event('input'));
    finalGradeInput.value = '10';
    finalGradeInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const saveButton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    saveButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(groupData.saveStudentAssessment).toHaveBeenCalledWith('group-123', 'session-1', 'student-1', {
      scores: [
        { bloomId: 'bloom-remember', studentGrade: 7.5, finalGrade: 10 },
        { bloomId: 'bloom-understand', studentGrade: null, finalGrade: null },
        { bloomId: 'bloom-apply', studentGrade: null, finalGrade: null },
        { bloomId: 'bloom-analyze', studentGrade: null, finalGrade: null },
        { bloomId: 'bloom-evaluate', studentGrade: null, finalGrade: null },
        { bloomId: 'bloom-create', studentGrade: null, finalGrade: null },
      ],
    });
    expect(fixture.nativeElement.textContent).toContain('Assessment saved.');
  });
});

function bloom(id: string, code: string, nameEn: string, levelOrder: number) {
  return {
    id,
    code,
    nameEn,
    nameAr: nameEn,
    descriptionEn: null,
    descriptionAr: null,
    levelOrder,
  };
}
