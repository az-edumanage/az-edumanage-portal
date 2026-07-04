import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantStudentsDataService } from '../../data-access/tenant-students-data.service';
import { StudentDetails, StudentScheduleRow, StudentScheduleSummary } from '../../models/tenant-students.models';
import { renderStudentBarcodeSvg } from './student-barcode-renderer';

const EMPTY_SCHEDULE_SUMMARY: StudentScheduleSummary = {
  attendanceLabel: '0%',
  attendanceProgress: 0,
  scheduleDaysCount: 0,
  totalGroups: 0,
  groupsCount: 0,
};

@Component({
  selector: 'app-tenant-student-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './tenant-student-details.component.html',
  styleUrl: './tenant-student-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantStudentDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly data = inject(TenantStudentsDataService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly student = signal<StudentDetails | null>(null);
  readonly barcodeSvg = signal<SafeHtml | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly scheduleSearchQuery = signal('');
  readonly schedulePageIndex = signal(0);
  readonly schedulePageSize = signal(5);
  readonly scheduleSummary = computed(() => this.student()?.scheduleSummary ?? EMPTY_SCHEDULE_SUMMARY);
  readonly filteredScheduleRows = computed(() => {
    const rows = this.student()?.scheduleRows ?? [];
    const query = this.scheduleSearchQuery().trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) =>
      [row.group, row.day, row.time, row.room, row.teacher].some((value) => value?.toLowerCase().includes(query)),
    );
  });
  readonly scheduleTotalItems = computed(() => this.filteredScheduleRows().length);
  readonly scheduleTotalPages = computed(() => Math.max(1, Math.ceil(this.scheduleTotalItems() / this.schedulePageSize())));
  readonly pagedScheduleRows = computed(() => {
    const pageSize = this.schedulePageSize();
    const start = this.schedulePageIndex() * pageSize;
    return this.filteredScheduleRows().slice(start, start + pageSize);
  });
  readonly schedulePageStart = computed(() => (this.scheduleTotalItems() === 0 ? 0 : this.schedulePageIndex() * this.schedulePageSize() + 1));
  readonly schedulePageEnd = computed(() => Math.min(this.scheduleTotalItems(), (this.schedulePageIndex() + 1) * this.schedulePageSize()));
  readonly studentInitial = computed(() => this.student()?.name?.trim().charAt(0).toUpperCase() || 'S');
  readonly currentGroupLabel = computed(() => {
    const student = this.student();
    if (!student) {
      return 'Not assigned';
    }
    const firstGroup = student.scheduleRows.find((row) => row.group?.trim());
    return firstGroup?.group?.trim() || `${student.stage || student.educationCategory} ${student.grade ? `- ${student.grade}` : ''}`.trim();
  });
  readonly nextClass = computed(() => {
    const row = this.student()?.scheduleRows.find((item) => item.day || item.time || item.group);
    if (!row) {
      return null;
    }
    return {
      title: row.day && row.time ? `${row.day}, ${row.time}` : row.day || row.time || 'Scheduled class',
      meta: [row.group, row.room].filter(Boolean).join(' - '),
    };
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Student not found');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.data.getStudent(id).subscribe({
      next: (student) => {
        this.student.set(student);
        this.renderBarcode(student.barcodeNumber);
        this.isLoading.set(false);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.barcodeSvg.set(null);
        this.isLoading.set(false);
      },
    });
  }

  setScheduleSearchQuery(value: string): void {
    this.scheduleSearchQuery.set(value);
    this.schedulePageIndex.set(0);
  }

  setSchedulePageSize(value: number | string): void {
    const pageSize = Number(value);
    this.schedulePageSize.set(Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 5);
    this.schedulePageIndex.set(0);
  }

  previousSchedulePage(): void {
    this.schedulePageIndex.update((page) => Math.max(0, page - 1));
  }

  nextSchedulePage(): void {
    this.schedulePageIndex.update((page) => Math.min(this.scheduleTotalPages() - 1, page + 1));
  }

  scheduleRowTrack(row: StudentScheduleRow): string {
    return `${row.groupId || row.group}-${row.day}-${row.time}-${row.room}-${row.teacher}`;
  }

  private renderBarcode(barcodeNumber: string): void {
    const result = renderStudentBarcodeSvg(barcodeNumber);
    this.barcodeSvg.set(result ? this.sanitizer.bypassSecurityTrustHtml(result.svg) : null);
  }
}
