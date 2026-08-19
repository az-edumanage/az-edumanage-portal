import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom, forkJoin } from 'rxjs';
import QRCode from 'qrcode';
import { TenantGroupDetailsDataService } from '../../data-access/tenant-group-details-data.service';
import { TenantStudentsDataService } from '../../data-access/tenant-students-data.service';
import { TenantLmsSettingsDataService } from '../../data-access/tenant-lms-settings-data.service';
import { GroupDetails } from '../../models/tenant-group-details.models';
import { StudentDetails, StudentScheduleRow } from '../../models/tenant-students.models';
import { renderStudentBarcodeSvg } from '../tenant-student-details/student-barcode-renderer';

interface GroupAccountCard {
  student: StudentDetails;
  barcodeSvg: SafeHtml | null;
  studentLoginPassword: string;
  parentLoginPassword: string;
  passwordsReady: boolean;
  passwordMessage: string;
}

@Component({
  selector: 'app-tenant-group-accounts-info',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-group-accounts-info.component.html',
  styleUrl: './tenant-group-accounts-info.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantGroupAccountsInfoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly groupData = inject(TenantGroupDetailsDataService);
  private readonly studentData = inject(TenantStudentsDataService);
  private readonly lmsSettings = inject(TenantLmsSettingsDataService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly group = signal<GroupDetails | null>(null);
  readonly cards = signal<GroupAccountCard[]>([]);
  readonly tenantName = signal('منصة الطالب');
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly studentQrDataUrl = signal('');
  readonly parentQrDataUrl = signal('');
  readonly allPasswordsReady = computed(() => this.cards().length > 0 && this.cards().every((card) => card.passwordsReady));

  ngOnInit(): void {
    void this.loadTenantName();
    void this.renderQrCodes();
    void this.load();
  }

  async load(): Promise<void> {
    const groupId = this.route.snapshot.paramMap.get('id');
    if (!groupId) {
      this.errorMessage.set('Group not found');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.cards.set([]);
    try {
      const group = await firstValueFrom(this.groupData.loadGroupById(groupId));
      this.group.set(group);
      const students = group.students ?? [];
      const details = await Promise.all(students.map((student) => firstValueFrom(this.studentData.getStudent(student.id))));
      const cards = details.map((student) => this.toAccountCard(student));
      this.cards.set(cards);
      await Promise.all(cards.map((card) => this.ensureLoginPasswords(card)));
      this.cards.set([...cards]);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load group accounts info');
      this.group.set(null);
      this.cards.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  printCards(): void {
    document.body.classList.add('activation-card-printing');
    const cleanup = (): void => {
      document.body.classList.remove('activation-card-printing');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 1000);
  }

  educationLabel(student: StudentDetails): string {
    return [student.stage, student.grade].filter(Boolean).join(' · ') || student.educationCategory || 'غير محدد';
  }

  groupRows(student: StudentDetails): string[] {
    const currentGroupId = this.group()?.id;
    const rows = currentGroupId
      ? student.scheduleRows.filter((row) => row.groupId === currentGroupId)
      : student.scheduleRows;
    return this.uniqueGroups(rows.length ? rows : student.scheduleRows);
  }

  studentPortalUrl(): string {
    return `${this.origin()}/student/login`;
  }

  parentPortalUrl(): string {
    return `${this.origin()}/parent/login`;
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

  private toAccountCard(student: StudentDetails): GroupAccountCard {
    const barcode = renderStudentBarcodeSvg(student.barcodeNumber);
    return {
      student,
      barcodeSvg: barcode ? this.sanitizer.bypassSecurityTrustHtml(barcode.svg) : null,
      studentLoginPassword: '',
      parentLoginPassword: '',
      passwordsReady: false,
      passwordMessage: 'Preparing login passwords...',
    };
  }

  private async ensureLoginPasswords(card: GroupAccountCard): Promise<void> {
    const studentPassword = card.student.studentLoginPassword?.trim() ?? '';
    const parentPassword = card.student.parentLoginPassword?.trim() ?? '';
    if (studentPassword && (!card.student.parentAppUserId || parentPassword)) {
      card.studentLoginPassword = studentPassword;
      card.parentLoginPassword = parentPassword;
      card.passwordsReady = true;
      card.passwordMessage = 'Displayed passwords are the saved login passwords.';
      return;
    }

    const activationCode = this.activationCode(card.student);
    const generatedStudentPassword = `Std@${activationCode}`;
    const generatedParentPassword = `Prnt@${activationCode}`;
    card.passwordMessage = 'Resetting login passwords...';
    const updates = [this.studentData.changeStudentPassword(card.student.id, generatedStudentPassword)];
    if (card.student.parentAppUserId) {
      updates.push(this.studentData.changeParentPassword(card.student.parentAppUserId, generatedParentPassword));
    }
    try {
      await firstValueFrom(forkJoin(updates));
      card.studentLoginPassword = generatedStudentPassword;
      card.parentLoginPassword = card.student.parentAppUserId ? generatedParentPassword : '';
      card.passwordsReady = true;
      card.passwordMessage = 'Displayed passwords are saved and ready for login.';
    } catch (error) {
      card.passwordsReady = false;
      card.passwordMessage = error instanceof Error ? error.message : 'Unable to save login passwords.';
    }
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

  private activationCode(student: StudentDetails): string {
    const source = student.barcodeNumber || student.id || '0000';
    const clean = source.replace(/\D/g, '');
    return (clean || source.replace(/[^a-zA-Z0-9]/g, '') || '0000').slice(-4).padStart(4, '0');
  }

  private origin(): string {
    return typeof window === 'undefined' ? '' : window.location.origin;
  }
}
