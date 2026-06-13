import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { I18nService } from '../../../../core/services/i18n.service';
import { TenantUniversitySubjectsFacade } from '../../state/tenant-university-subjects.facade';
import { TenantUniversitySubjectDetailsComponent } from './tenant-university-subject-details.component';

describe('TenantUniversitySubjectDetailsComponent', () => {
  let fixture: ComponentFixture<TenantUniversitySubjectDetailsComponent>;
  const facade = {
    loading: signal(false),
    loadError: signal<string | null>(null),
    deleteError: signal<string | null>(null),
    deletingId: signal<string | null>(null),
    getSubject: vi.fn().mockResolvedValue({
      id: 'subject-1',
      universityId: 'university-1',
      universityName: 'Cairo University',
      collegeId: 'college-1',
      collegeName: 'Engineering',
      name: 'Computer Science',
      description: null,
      groupCount: 0,
      studentCount: 0,
      assignedTeachersCount: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      teachers: [{
        id: 'teacher-1',
        name: 'Sarah Nabil',
        email: 'sarah@example.com',
        phone: '0100000000',
        status: 'Active',
        joinDate: '2026-01-02',
      }],
    }),
    deleteSubject: vi.fn().mockResolvedValue(true),
    goToList: vi.fn().mockResolvedValue(true),
  };
  const i18n = {
    language: signal<'en' | 'ar'>('en'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantUniversitySubjectDetailsComponent],
      providers: [
        provideRouter([]),
        { provide: TenantUniversitySubjectsFacade, useValue: facade },
        { provide: I18nService, useValue: i18n },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'subject-1' }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantUniversitySubjectDetailsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
    i18n.language.set('en');
  });

  it('renders assigned teachers like the basic subject detail page', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(facade.getSubject).toHaveBeenCalledWith('subject-1');
    expect(text).toContain('Computer Science');
    expect(text).toContain('Cairo University');
    expect(text).toContain('Engineering');
    expect(text).toContain('Assigned Teachers');
    expect(text).toContain('Sarah Nabil');
    expect(text).toContain('sarah@example.com');
    expect(text).toContain('0100000000');
    expect(text).toContain('Active');
    expect(text).toContain('Showing 1-1 of 1 teachers');
    expect(text).toContain('Page 1 of 1');
  });

  it('renders assigned teachers labels in RTL for Arabic', () => {
    i18n.language.set('ar');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    const page = fixture.debugElement.query(By.css('.subject-details-page')).nativeElement as HTMLElement;
    const tables = fixture.debugElement.queryAll(By.css('.subject-details-table'));

    expect(page.getAttribute('dir')).toBe('rtl');
    expect(tables.every((table) => (table.nativeElement as HTMLElement).getAttribute('dir') === 'rtl')).toBe(true);
    expect(text).toContain('المعلمون المسندون');
    expect(text).toContain('الهاتف');
    expect(text).toContain('الحالة');
    expect(text).toContain('تاريخ الانضمام');
    expect(text).toContain('نشط');
    expect(text).toContain('عرض 1-1 من 1 معلمين');
    expect(text).toContain('صفحة 1 من 1');
  });
});
