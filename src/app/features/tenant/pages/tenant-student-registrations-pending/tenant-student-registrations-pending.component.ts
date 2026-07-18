import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { StudentRegistrationDataService } from '../../data-access/student-registration-data.service';
import { PendingStudentRegistration } from '../../models/student-registration.models';

@Component({
  selector: 'app-tenant-student-registrations-pending',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './tenant-student-registrations-pending.component.html',
  styleUrl: './tenant-student-registrations-pending.component.css',
})
export class TenantStudentRegistrationsPendingComponent {
  private readonly data = inject(StudentRegistrationDataService);
  readonly pendingCount = this.data.pendingCount;
  readonly requests = signal<PendingStudentRegistration[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly actionId = signal<string | null>(null);
  readonly rejectTarget = signal<PendingStudentRegistration | null>(null);
  readonly rejectionReason = signal('');

  constructor() {
    this.data.startCountPolling();
    void this.load();
  }

  async approve(request: PendingStudentRegistration): Promise<void> {
    if (this.actionId()) return;
    this.actionId.set(request.id);
    this.error.set(null);
    try {
      await firstValueFrom(this.data.approve(request.id));
      this.requests.update((items) => items.filter((item) => item.id !== request.id));
      await this.data.refreshCount();
    } catch (error) {
      this.error.set(this.data.errorMessage(error, 'The student request could not be approved.'));
    } finally {
      this.actionId.set(null);
    }
  }

  openReject(request: PendingStudentRegistration): void {
    this.rejectionReason.set('');
    this.rejectTarget.set(request);
  }

  closeReject(): void {
    if (!this.actionId()) this.rejectTarget.set(null);
  }

  async confirmReject(): Promise<void> {
    const request = this.rejectTarget();
    const reason = this.rejectionReason().trim();
    if (!request || !reason || this.actionId()) return;
    this.actionId.set(request.id);
    this.error.set(null);
    try {
      await firstValueFrom(this.data.reject(request.id, reason));
      this.requests.update((items) => items.filter((item) => item.id !== request.id));
      this.rejectTarget.set(null);
      await this.data.refreshCount();
    } catch (error) {
      this.error.set(this.data.errorMessage(error, 'The student request could not be rejected.'));
    } finally {
      this.actionId.set(null);
    }
  }

  educationLabel(request: PendingStudentRegistration): string {
    return request.educationCategory === 'BASIC_EDUCATION'
      ? [request.stageName, request.gradeName].filter(Boolean).join(' / ')
      : [request.universityName, request.collegeName].filter(Boolean).join(' / ');
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.requests.set(await firstValueFrom(this.data.listPending()));
      this.error.set(null);
      await this.data.refreshCount();
    } catch (error) {
      this.error.set(this.data.errorMessage(error, 'Pending registrations could not be loaded.'));
    } finally {
      this.loading.set(false);
    }
  }
}
