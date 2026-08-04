import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import QRCode from 'qrcode';
import { TenantStudentsDataService } from '../../data-access/tenant-students-data.service';
import { TenantLmsSettingsDataService } from '../../data-access/tenant-lms-settings-data.service';
import { StudentDetails, StudentScheduleRow } from '../../models/tenant-students.models';
import { renderStudentBarcodeSvg } from '../tenant-student-details/student-barcode-renderer';

@Component({
  selector: 'app-tenant-student-activation-card',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-student-activation-card.component.html',
  styleUrl: './tenant-student-activation-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantStudentActivationCardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly data = inject(TenantStudentsDataService);
  private readonly lmsSettings = inject(TenantLmsSettingsDataService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly student = signal<StudentDetails | null>(null);
  readonly barcodeSvg = signal<SafeHtml | null>(null);
  readonly tenantName = signal('منصة الطالب');
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly passwordSyncMessage = signal<string | null>(null);
  readonly passwordsReady = signal(false);
  readonly studentLoginPassword = signal('');
  readonly parentLoginPassword = signal('');
  readonly studentQrDataUrl = signal('');
  readonly parentQrDataUrl = signal('');

  readonly educationLabel = computed(() => {
    const current = this.student();
    if (!current) return 'غير محدد';
    return [current.stage, current.grade].filter(Boolean).join(' · ') || current.educationCategory || 'غير محدد';
  });
  readonly groupRows = computed(() => this.uniqueGroups(this.student()?.scheduleRows ?? []));
  readonly studentPortalUrl = computed(() => `${this.origin()}/student/login`);
  readonly parentPortalUrl = computed(() => `${this.origin()}/parent/login`);
  readonly activationCode = computed(() => this.activationCodeFrom(this.student()?.barcodeNumber || this.student()?.id || '0000'));

  ngOnInit(): void {
    void this.loadTenantName();
    void this.renderQrCodes();
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
        this.displayStoredLoginPasswords(student);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.student.set(null);
        this.barcodeSvg.set(null);
        this.isLoading.set(false);
      },
    });
  }

  printCard(): void {
    document.body.classList.add('activation-card-printing');
    const cleanup = (): void => {
      document.body.classList.remove('activation-card-printing');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 1000);
  }

  private async loadTenantName(): Promise<void> {
    try {
      const settings = await this.lmsSettings.getSettings();
      this.tenantName.set(settings.tenantName?.trim() || settings.brand?.teacherName?.trim() || 'منصة الطالب');
    } catch {
      this.tenantName.set('منصة الطالب');
    }
  }

  private async renderQrCodes(): Promise<void> {
    const options: QRCode.QRCodeToDataURLOptions = {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 236,
      color: {
        dark: '#092d4d',
        light: '#ffffff',
      },
    };
    try {
      const [studentQr, parentQr] = await Promise.all([
        QRCode.toDataURL(this.studentPortalUrl(), options),
        QRCode.toDataURL(this.parentPortalUrl(), options),
      ]);
      this.studentQrDataUrl.set(studentQr);
      this.parentQrDataUrl.set(parentQr);
    } catch {
      this.studentQrDataUrl.set('');
      this.parentQrDataUrl.set('');
    }
  }

  private renderBarcode(barcodeNumber: string): void {
    const result = renderStudentBarcodeSvg(barcodeNumber);
    this.barcodeSvg.set(result ? this.sanitizer.bypassSecurityTrustHtml(result.svg) : null);
  }

  private syncActivationPasswords(student: StudentDetails): void {
    const studentPassword = `Std@${this.activationCode()}`;
    const parentPassword = `Prnt@${this.activationCode()}`;
    this.passwordsReady.set(false);
    this.studentLoginPassword.set('');
    this.parentLoginPassword.set('');

    const updates = [this.data.changeStudentPassword(student.id, studentPassword)];
    if (student.parentAppUserId) {
      updates.push(this.data.changeParentPassword(student.parentAppUserId, parentPassword));
    }
    this.passwordSyncMessage.set('Resetting login passwords...');
    forkJoin(updates).subscribe({
      next: () => {
        this.studentLoginPassword.set(studentPassword);
        this.parentLoginPassword.set(student.parentAppUserId ? parentPassword : '');
        this.passwordsReady.set(true);
        this.passwordSyncMessage.set('Displayed passwords are saved and ready for login.');
      },
      error: (error: Error) => {
        this.passwordsReady.set(false);
        this.passwordSyncMessage.set(error.message || 'Unable to save login passwords.');
      },
    });
  }

  private displayStoredLoginPasswords(student: StudentDetails): void {
    const studentPassword = student.studentLoginPassword?.trim() ?? '';
    const parentPassword = student.parentLoginPassword?.trim() ?? '';
    if (studentPassword && (!student.parentAppUserId || parentPassword)) {
      this.studentLoginPassword.set(studentPassword);
      this.parentLoginPassword.set(parentPassword);
      this.passwordsReady.set(true);
      this.passwordSyncMessage.set('Displayed passwords are the saved login passwords.');
      return;
    }
    this.syncActivationPasswords(student);
  }

  private uniqueGroups(rows: StudentScheduleRow[]): string[] {
    const labels = new Set<string>();
    for (const row of rows) {
      const group = row.group?.trim();
      if (!group) continue;
      const timing = [row.day, row.time].filter(Boolean).join(' ');
      labels.add(timing ? `${group} · ${timing}` : group);
    }
    return [...labels].slice(0, 6);
  }

  private activationCodeFrom(source: string): string {
    const clean = source.replace(/\D/g, '');
    return (clean || source.replace(/[^a-zA-Z0-9]/g, '') || '0000').slice(-4).padStart(4, '0');
  }

  private origin(): string {
    return typeof window === 'undefined' ? '' : window.location.origin;
  }
}
