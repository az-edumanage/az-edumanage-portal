import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { I18nService } from '../../../../core/services/i18n.service';
import { TenantSubjectDetailsFacade } from '../../state/tenant-subject-details.facade';

type SubjectDetailsLabelKey =
  | 'subjects'
  | 'subjectDetails'
  | 'loadingTitle'
  | 'loadingMessage'
  | 'loadErrorTitle'
  | 'backToSubjects'
  | 'educationalStage'
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
  | 'groups'
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
  | 'grade'
  | 'created'
  | 'lastUpdated';

const SUBJECT_DETAILS_LABELS: Record<SubjectDetailsLabelKey, { en: string; ar: string }> = {
  subjects: { en: 'Subjects', ar: 'المواد' },
  subjectDetails: { en: 'Subject Details', ar: 'تفاصيل المادة' },
  loadingTitle: { en: 'Loading subject details', ar: 'جاري تحميل تفاصيل المادة' },
  loadingMessage: { en: 'Please wait while the subject is loaded.', ar: 'يرجى الانتظار أثناء تحميل المادة.' },
  loadErrorTitle: { en: 'Unable to load subject', ar: 'تعذر تحميل المادة' },
  backToSubjects: { en: 'Back to Subjects', ar: 'العودة إلى المواد' },
  educationalStage: { en: 'Educational Stage', ar: 'المرحلة التعليمية' },
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
  noGroupsAssigned: { en: 'No groups are assigned to this subject.', ar: 'لا توجد مجموعات مسندة لهذه المادة.' },
  noTeachersAssigned: { en: 'No teachers are assigned to this subject.', ar: 'لا يوجد معلمون مسندون لهذه المادة.' },
  noGroupsDisplay: { en: 'No groups to display', ar: 'لا توجد مجموعات للعرض' },
  noTeachersDisplay: { en: 'No teachers to display', ar: 'لا يوجد معلمون للعرض' },
  rows: { en: 'Rows', ar: 'الصفوف' },
  page: { en: 'Page', ar: 'صفحة' },
  of: { en: 'of', ar: 'من' },
  groups: { en: 'groups', ar: 'مجموعات' },
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
  grade: { en: 'Grade', ar: 'الصف' },
  created: { en: 'Created', ar: 'تاريخ الإنشاء' },
  lastUpdated: { en: 'Last Updated', ar: 'آخر تحديث' },
};

@Component({
  selector: 'app-tenant-subject-details',
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './tenant-subject-details.component.html',
  styleUrls: ['./tenant-subject-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantSubjectDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TenantSubjectDetailsFacade);
  private readonly i18n = inject(I18nService);

  readonly subject = this.facade.subject;
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;
  readonly groupsPageIndex = signal(0);
  readonly groupsPageSize = signal(10);
  readonly teachersPageIndex = signal(0);
  readonly teachersPageSize = signal(10);
  readonly totalGroups = computed(() => this.subject()?.groups.length ?? 0);
  readonly totalTeachers = computed(() => this.subject()?.teachers.length ?? 0);
  readonly groupsTotalPages = computed(() => Math.max(1, Math.ceil(this.totalGroups() / this.groupsPageSize())));
  readonly teachersTotalPages = computed(() => Math.max(1, Math.ceil(this.totalTeachers() / this.teachersPageSize())));
  readonly clampedGroupsPageIndex = computed(() => Math.min(this.groupsPageIndex(), this.groupsTotalPages() - 1));
  readonly clampedTeachersPageIndex = computed(() => Math.min(this.teachersPageIndex(), this.teachersTotalPages() - 1));
  readonly pagedGroups = computed(() => {
    const subject = this.subject();
    if (!subject) {
      return [];
    }
    const start = this.clampedGroupsPageIndex() * this.groupsPageSize();
    return subject.groups.slice(start, start + this.groupsPageSize());
  });
  readonly pagedTeachers = computed(() => {
    const subject = this.subject();
    if (!subject) {
      return [];
    }
    const start = this.clampedTeachersPageIndex() * this.teachersPageSize();
    return subject.teachers.slice(start, start + this.teachersPageSize());
  });
  readonly groupsPageStart = computed(() => this.totalGroups() === 0 ? 0 : this.clampedGroupsPageIndex() * this.groupsPageSize() + 1);
  readonly groupsPageEnd = computed(() => Math.min((this.clampedGroupsPageIndex() + 1) * this.groupsPageSize(), this.totalGroups()));
  readonly teachersPageStart = computed(() => this.totalTeachers() === 0 ? 0 : this.clampedTeachersPageIndex() * this.teachersPageSize() + 1);
  readonly teachersPageEnd = computed(() => Math.min((this.clampedTeachersPageIndex() + 1) * this.teachersPageSize(), this.totalTeachers()));

  isRtl(): boolean {
    return this.i18n.language() === 'ar';
  }

  pageDirection(): 'rtl' | 'ltr' {
    return this.isRtl() ? 'rtl' : 'ltr';
  }

  label(key: SubjectDetailsLabelKey): string {
    return SUBJECT_DETAILS_LABELS[key][this.i18n.language()];
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

  showingRangeLabel(start: number, end: number, total: number, itemLabelKey: 'groups' | 'teachers'): string {
    if (this.isRtl()) {
      return `${this.label('showing')} ${start}-${end} ${this.label('of')} ${total} ${this.label(itemLabelKey)}`;
    }
    return `${this.label('showing')} ${start}-${end} ${this.label('of')} ${total} ${this.label(itemLabelKey)}`;
  }

  pageLabel(page: number, totalPages: number): string {
    return `${this.label('page')} ${page} ${this.label('of')} ${totalPages}`;
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.resetGroupsPage();
        this.resetTeachersPage();
        void this.facade.loadSubject(params.get('id'));
      });
  }

  setGroupsPageSize(value: number | string): void {
    this.groupsPageSize.set(this.normalizePageSize(value));
    this.resetGroupsPage();
  }

  previousGroupsPage(): void {
    this.groupsPageIndex.set(Math.max(0, this.groupsPageIndex() - 1));
  }

  nextGroupsPage(): void {
    this.groupsPageIndex.set(Math.min(this.groupsTotalPages() - 1, this.groupsPageIndex() + 1));
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

  private resetGroupsPage(): void {
    this.groupsPageIndex.set(0);
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
