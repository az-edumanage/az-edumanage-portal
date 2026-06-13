import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../../../../core/services/i18n.service';
import { TenantUniversitySubject } from '../../models/tenant-university-subjects.models';
import { TenantUniversitySubjectsFacade } from '../../state/tenant-university-subjects.facade';

type UniversitySubjectDetailsLabelKey =
  | 'subjects'
  | 'subjectDetails'
  | 'loadingTitle'
  | 'loadingMessage'
  | 'loadErrorTitle'
  | 'backToSubjects'
  | 'university'
  | 'college'
  | 'assignedGroups'
  | 'totalStudents'
  | 'assignedTeachers'
  | 'groupName'
  | 'students'
  | 'teacher'
  | 'phone'
  | 'status'
  | 'joinDate'
  | 'unassigned'
  | 'notSet'
  | 'noGroupsAssigned'
  | 'noTeachersAssigned'
  | 'noGroupsDisplay'
  | 'noTeachersDisplay'
  | 'rows'
  | 'page'
  | 'of'
  | 'teachers'
  | 'showing'
  | 'previousPage'
  | 'nextPage'
  | 'quickActions'
  | 'addCurriculum'
  | 'newGroup'
  | 'newSubject'
  | 'subjectMetadata'
  | 'subjectName'
  | 'created'
  | 'lastUpdated';

const UNIVERSITY_SUBJECT_DETAILS_LABELS: Record<UniversitySubjectDetailsLabelKey, { en: string; ar: string }> = {
  subjects: { en: 'Subjects', ar: 'المواد' },
  subjectDetails: { en: 'Subject Details', ar: 'تفاصيل المادة' },
  loadingTitle: { en: 'Loading subject details', ar: 'جاري تحميل تفاصيل المادة' },
  loadingMessage: { en: 'Please wait while the subject is loaded.', ar: 'يرجى الانتظار أثناء تحميل المادة.' },
  loadErrorTitle: { en: 'Unable to load subject', ar: 'تعذر تحميل المادة' },
  backToSubjects: { en: 'Back to Subjects', ar: 'العودة إلى المواد' },
  university: { en: 'University', ar: 'الجامعة' },
  college: { en: 'College', ar: 'الكلية' },
  assignedGroups: { en: 'Assigned Groups', ar: 'المجموعات المسندة' },
  totalStudents: { en: 'Total Students', ar: 'إجمالي الطلاب' },
  assignedTeachers: { en: 'Assigned Teachers', ar: 'المعلمون المسندون' },
  groupName: { en: 'Group Name', ar: 'اسم المجموعة' },
  students: { en: 'Students', ar: 'الطلاب' },
  teacher: { en: 'Teacher', ar: 'المعلم' },
  phone: { en: 'Phone', ar: 'الهاتف' },
  status: { en: 'Status', ar: 'الحالة' },
  joinDate: { en: 'Join Date', ar: 'تاريخ الانضمام' },
  unassigned: { en: 'Unassigned', ar: 'غير مسند' },
  notSet: { en: 'Not set', ar: 'غير محدد' },
  noGroupsAssigned: { en: 'No groups are assigned to this university subject.', ar: 'لا توجد مجموعات مسندة لهذه المادة الجامعية.' },
  noTeachersAssigned: { en: 'No teachers are assigned to this university subject.', ar: 'لا يوجد معلمون مسندون لهذه المادة الجامعية.' },
  noGroupsDisplay: { en: 'No groups to display', ar: 'لا توجد مجموعات للعرض' },
  noTeachersDisplay: { en: 'No teachers to display', ar: 'لا يوجد معلمون للعرض' },
  rows: { en: 'Rows', ar: 'الصفوف' },
  page: { en: 'Page', ar: 'صفحة' },
  of: { en: 'of', ar: 'من' },
  teachers: { en: 'teachers', ar: 'معلمين' },
  showing: { en: 'Showing', ar: 'عرض' },
  previousPage: { en: 'Previous page', ar: 'الصفحة السابقة' },
  nextPage: { en: 'Next page', ar: 'الصفحة التالية' },
  quickActions: { en: 'Quick Actions', ar: 'إجراءات سريعة' },
  addCurriculum: { en: 'The Curriculum', ar: 'المنهج' },
  newGroup: { en: 'New Group', ar: 'مجموعة جديدة' },
  newSubject: { en: 'New Subject', ar: 'مادة جديدة' },
  subjectMetadata: { en: 'Subject Metadata', ar: 'بيانات المادة' },
  subjectName: { en: 'Subject Name', ar: 'اسم المادة' },
  created: { en: 'Created', ar: 'تاريخ الإنشاء' },
  lastUpdated: { en: 'Last Updated', ar: 'آخر تحديث' },
};

@Component({
  selector: 'app-tenant-university-subject-details',
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './tenant-university-subject-details.component.html',
  styleUrl: './tenant-university-subject-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantUniversitySubjectDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantUniversitySubjectsFacade);
  private readonly i18n = inject(I18nService);

  readonly subject = signal<TenantUniversitySubject | null>(null);
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;
  readonly deleteError = this.facade.deleteError;
  readonly deletingId = this.facade.deletingId;
  readonly teachersPageIndex = signal(0);
  readonly teachersPageSize = signal(10);
  readonly totalTeachers = computed(() => this.subject()?.teachers.length ?? 0);
  readonly teachersTotalPages = computed(() => Math.max(1, Math.ceil(this.totalTeachers() / this.teachersPageSize())));
  readonly clampedTeachersPageIndex = computed(() => Math.min(this.teachersPageIndex(), this.teachersTotalPages() - 1));
  readonly pagedTeachers = computed(() => {
    const subject = this.subject();
    if (!subject) {
      return [];
    }
    const start = this.clampedTeachersPageIndex() * this.teachersPageSize();
    return subject.teachers.slice(start, start + this.teachersPageSize());
  });
  readonly teachersPageStart = computed(() => this.totalTeachers() === 0 ? 0 : this.clampedTeachersPageIndex() * this.teachersPageSize() + 1);
  readonly teachersPageEnd = computed(() => Math.min((this.clampedTeachersPageIndex() + 1) * this.teachersPageSize(), this.totalTeachers()));

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    this.resetTeachersPage();
    this.subject.set(id ? await this.facade.getSubject(id) : null);
  }

  isRtl(): boolean {
    return this.i18n.language() === 'ar';
  }

  pageDirection(): 'rtl' | 'ltr' {
    return this.isRtl() ? 'rtl' : 'ltr';
  }

  label(key: UniversitySubjectDetailsLabelKey): string {
    return UNIVERSITY_SUBJECT_DETAILS_LABELS[key][this.i18n.language()];
  }

  breadcrumbSeparatorIcon(): string {
    return this.isRtl() ? 'chevron_left' : 'chevron_right';
  }

  statusLabel(status: string | null | undefined): string {
    if (!status) {
      return this.label('notSet');
    }

    const normalized = status.trim().toLowerCase();
    if (!this.isRtl()) {
      return status;
    }

    const labels: Record<string, string> = {
      active: 'نشط',
      inactive: 'غير نشط',
      enabled: 'مفعل',
      disabled: 'معطل',
      pending: 'قيد الانتظار',
    };
    return labels[normalized] ?? status;
  }

  showingRangeLabel(start: number, end: number, total: number): string {
    return `${this.label('showing')} ${start}-${end} ${this.label('of')} ${total} ${this.label('teachers')}`;
  }

  pageLabel(page: number, totalPages: number): string {
    return `${this.label('page')} ${page} ${this.label('of')} ${totalPages}`;
  }

  setTeachersPageSize(value: number | string): void {
    this.teachersPageSize.set(this.normalizePageSize(value));
    this.resetTeachersPage();
  }

  previousTeachersPage(): void {
    this.teachersPageIndex.set(Math.max(0, this.teachersPageIndex() - 1));
  }

  nextTeachersPage(): void {
    this.teachersPageIndex.set(Math.min(this.teachersTotalPages() - 1, this.teachersPageIndex() + 1));
  }

  async deleteSubject(): Promise<void> {
    const subject = this.subject();
    if (!subject) {
      return;
    }
    if (await this.facade.deleteSubject(subject.id)) {
      await this.facade.goToList();
    }
  }

  private resetTeachersPage(): void {
    this.teachersPageIndex.set(0);
  }

  private normalizePageSize(value: number | string): number {
    const numericValue = typeof value === 'number' ? value : Number(value);
    const next = Number.isFinite(numericValue) ? Math.trunc(numericValue) : 10;
    return Math.max(1, next);
  }
}
