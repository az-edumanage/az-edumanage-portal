import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { I18nService } from '../../../../core/services/i18n.service';
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
      assignedTeachersCount: 1,
      totalStudentsCount: 7,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      groups: [{ id: 'group-1', name: 'Group A', studentsCount: 7, teacherName: 'Sarah Nabil' }],
      teachers: [{
        id: 'teacher-1',
        name: 'Sarah Nabil',
        email: 'sarah@example.com',
        phone: '0100000000',
        status: 'Active',
        joinDate: '2026-01-02',
      }],
    }),
    loading: signal(false),
    loadError: signal<string | null>(null),
    loadSubject: vi.fn().mockResolvedValue(undefined),
  };
  const i18n = {
    language: signal<'en' | 'ar'>('en'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantSubjectDetailsComponent],
      providers: [
        provideRouter([]),
        { provide: TenantSubjectDetailsFacade, useValue: facade },
        { provide: I18nService, useValue: i18n },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: 'subject-1' })) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantSubjectDetailsComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
    i18n.language.set('en');
  });

  it('renders metrics and assigned groups table', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Mathematics');
    expect(text).toContain('Assigned Groups');
    expect(text).toContain('Total Students');
    expect(text).toContain('7');
    expect(text).toContain('Assigned Teachers');
    expect(text).toContain('Subject Metadata');
    expect(text).toContain('Subject Name');
    expect(text).toContain('Educational Stage');
    expect(text).toContain('Quick Actions');
    expect(text).toContain('The Curriculum');
    expect(text).not.toContain('Add Curriculum');
    expect(text).toContain('New Group');
    expect(text).toContain('Group A');
    expect(text).toContain('Sarah Nabil');
    expect(text).toContain('sarah@example.com');
    expect(text).toContain('Showing 1-1 of 1 groups');
    expect(text).toContain('Showing 1-1 of 1 teachers');
    expect(text).toContain('Page 1 of 1');
    expect(text).not.toContain('Subject Information');
    expect(text).not.toContain('belongs to');
  });

  it('loads the route subject id on init', () => {
    expect(facade.loadSubject).toHaveBeenCalledWith('subject-1');
  });

  it('renders translated subject details in RTL for Arabic', () => {
    i18n.language.set('ar');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    const page = fixture.debugElement.query(By.css('.subject-details-page')).nativeElement as HTMLElement;
    const tables = fixture.debugElement.queryAll(By.css('.subject-details-table'));
    const breadcrumbIcon = fixture.debugElement.query(By.css('.subject-details-page mat-icon')).nativeElement as HTMLElement;

    expect(page.getAttribute('dir')).toBe('rtl');
    expect(tables.every((table) => (table.nativeElement as HTMLElement).getAttribute('dir') === 'rtl')).toBe(true);
    expect(breadcrumbIcon.textContent?.trim()).toBe('chevron_left');
    expect(text).toContain('المواد');
    expect(text).toContain('تفاصيل المادة');
    expect(text).toContain('المرحلة التعليمية');
    expect(text).toContain('المجموعات المسندة');
    expect(text).toContain('إجمالي الطلاب');
    expect(text).toContain('المعلمون المسندون');
    expect(text).toContain('اسم المجموعة');
    expect(text).toContain('الطلاب');
    expect(text).toContain('المعلم');
    expect(text).toContain('الهاتف');
    expect(text).toContain('الحالة');
    expect(text).toContain('نشط');
    expect(text).toContain('إجراءات سريعة');
    expect(text).toContain('المنهج');
    expect(text).not.toContain('إضافة منهج');
    expect(text).toContain('بيانات المادة');
    expect(text).toContain('اسم المادة');
    expect(text).toContain('الصف');
    expect(text).toContain('عرض 1-1 من 1 مجموعات');
    expect(text).toContain('عرض 1-1 من 1 معلمين');
    expect(text).toContain('صفحة 1 من 1');
    expect(text).not.toContain('Assigned Groups');
    expect(text).not.toContain('Quick Actions');
    expect(text).not.toContain('Subject Metadata');
  });
});
