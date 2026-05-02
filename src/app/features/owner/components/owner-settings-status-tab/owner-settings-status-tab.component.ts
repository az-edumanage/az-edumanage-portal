import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OwnerTenantStatusesDataService } from '../../data-access/owner-tenant-statuses-data.service';
import { OwnerSubscriptionStatusesDataService } from '../../data-access/owner-subscription-statuses-data.service';
import { OwnerSubscriptionOrderStatusesDataService } from '../../data-access/owner-subscription-order-statuses-data.service';
import { OwnerBillingStatusesDataService } from '../../data-access/owner-billing-statuses-data.service';
import { OwnerProvisioningStatusesDataService } from '../../data-access/owner-provisioning-statuses-data.service';
import { TenantStatusItem } from '../../models/owner-status.models';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-owner-settings-status-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './owner-settings-status-tab.component.html',
  styleUrl: './owner-settings-status-tab.component.css',
})
export class OwnerSettingsStatusTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly statusesData = inject(OwnerTenantStatusesDataService);
  private readonly subscriptionStatusesData = inject(OwnerSubscriptionStatusesDataService);
  private readonly subscriptionOrderStatusesData = inject(OwnerSubscriptionOrderStatusesDataService);
  private readonly billingStatusesData = inject(OwnerBillingStatusesDataService);
  private readonly provisioningStatusesData = inject(OwnerProvisioningStatusesDataService);

  readonly tenantStatuses = this.statusesData.statuses;
  readonly subscriptionStatuses = this.subscriptionStatusesData.statuses;
  readonly subscriptionOrderStatuses = this.subscriptionOrderStatusesData.statuses;
  readonly billingStatuses = this.billingStatusesData.statuses;
  readonly provisioningStatuses = this.provisioningStatusesData.statuses;
  readonly view = signal<'cards' | 'tenant-status' | 'subscription-status' | 'subscription-order-status' | 'billing-status' | 'provisioning-status'>('cards');
  readonly showModal = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly activeStatusType = signal<'tenant' | 'subscription' | 'subscription-order' | 'billing' | 'provisioning'>('tenant');

  readonly form = this.fb.group({
    nameEn: ['', Validators.required],
    nameAr: ['', Validators.required],
    color: ['#2563eb', Validators.required],
  });

  readonly canSubmit = computed(() => this.form.valid);

  openTenantStatus(): void {
    this.activeStatusType.set('tenant');
    this.view.set('tenant-status');
  }

  openSubscriptionStatus(): void {
    this.activeStatusType.set('subscription');
    this.view.set('subscription-status');
  }

  openSubscriptionOrderStatus(): void {
    this.activeStatusType.set('subscription-order');
    this.view.set('subscription-order-status');
  }

  openBillingStatus(): void {
    this.activeStatusType.set('billing');
    this.view.set('billing-status');
  }

  openProvisioningStatus(): void {
    this.activeStatusType.set('provisioning');
    this.view.set('provisioning-status');
  }

  goToCards(): void {
    this.view.set('cards');
  }

  openAddModal(): void {
    this.editingId.set(null);
    this.form.reset({ nameEn: '', nameAr: '', color: '#2563eb' });
    this.showModal.set(true);
  }

  openEditModal(status: TenantStatusItem): void {
    this.editingId.set(status.id);
    this.form.reset({
      nameEn: status.nameEn,
      nameAr: status.nameAr,
      color: status.color,
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveStatus(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      id: this.editingId() ?? undefined,
      nameEn: this.form.controls.nameEn.value ?? '',
      nameAr: this.form.controls.nameAr.value ?? '',
      color: this.form.controls.color.value ?? '#2563eb',
    };

    if (this.activeStatusType() === 'tenant') {
      this.statusesData.upsertStatus(payload);
    } else if (this.activeStatusType() === 'subscription') {
      this.subscriptionStatusesData.upsertStatus(payload);
    } else if (this.activeStatusType() === 'subscription-order') {
      this.subscriptionOrderStatusesData.upsertStatus(payload);
    } else if (this.activeStatusType() === 'provisioning') {
      this.provisioningStatusesData.upsertStatus(payload);
    } else {
      this.billingStatusesData.upsertStatus(payload);
    }
    this.closeModal();
  }

  deleteStatus(id: string): void {
    if (this.activeStatusType() === 'tenant') {
      this.statusesData.deleteStatus(id);
    } else if (this.activeStatusType() === 'subscription') {
      this.subscriptionStatusesData.deleteStatus(id);
    } else if (this.activeStatusType() === 'subscription-order') {
      this.subscriptionOrderStatusesData.deleteStatus(id);
    } else if (this.activeStatusType() === 'provisioning') {
      this.provisioningStatusesData.deleteStatus(id);
    } else {
      this.billingStatusesData.deleteStatus(id);
    }
  }
}
