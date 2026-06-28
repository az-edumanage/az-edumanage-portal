import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantStudentsDataService } from '../../data-access/tenant-students-data.service';
import { StudentDetails, StudentScheduleSummary } from '../../models/tenant-students.models';
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
  imports: [CommonModule, RouterModule, MatIconModule],
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
  readonly scheduleSummary = computed(() => this.student()?.scheduleSummary ?? EMPTY_SCHEDULE_SUMMARY);
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

  private renderBarcode(barcodeNumber: string): void {
    const result = renderStudentBarcodeSvg(barcodeNumber);
    this.barcodeSvg.set(result ? this.sanitizer.bypassSecurityTrustHtml(result.svg) : null);
  }
}
