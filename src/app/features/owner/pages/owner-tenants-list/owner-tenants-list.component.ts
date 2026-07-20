import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { UiPagerButtonComponent } from '../../../../shared/ui';
import { OwnerTenantsListFacade } from '../../state/owner-tenants-list.facade';
import { ManualSettlementRequest, Tenant, TenantSubscriptionType } from '../../models/owner-tenants.models';
import { OwnerTenantStatusesDataService } from '../../data-access/owner-tenant-statuses-data.service';
import { OwnerTenantsDataService } from '../../data-access/owner-tenants-data.service';
import { TenantImpersonationService } from '../../../../core/auth/tenant-impersonation.service';

@Component({
  selector: 'app-owner-tenants-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule, UiPagerButtonComponent],
  templateUrl: './owner-tenants-list.component.html',
  styleUrl: './owner-tenants-list.component.css'
})
export class OwnerTenantsListComponent implements OnInit {
  private router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly dashboardService = inject(DashboardService);
  private readonly i18nService = inject(I18nService);
  private readonly tenantsFacade = inject(OwnerTenantsListFacade);
  private readonly statusesData = inject(OwnerTenantStatusesDataService);
  private readonly tenantsData = inject(OwnerTenantsDataService);
  private readonly tenantImpersonationService = inject(TenantImpersonationService);

  readonly searchQuery = this.tenantsFacade.searchQuery;
  readonly showFiltersDropdown = this.tenantsFacade.showFiltersDropdown;
  readonly activeStatusDropdown = this.tenantsFacade.activeStatusDropdown;
  readonly pendingStatusChange = this.tenantsFacade.pendingStatusChange;
  readonly activePlanDropdown = this.tenantsFacade.activePlanDropdown;
  readonly pendingPlanChange = this.tenantsFacade.pendingPlanChange;
  readonly pendingManualSettlement = this.tenantsFacade.pendingManualSettlement;
  readonly pendingPasswordChange = this.tenantsFacade.pendingPasswordChange;
  readonly pendingLifecycleStatusTenantIds = this.tenantsFacade.pendingLifecycleStatusTenantIds;
  readonly lifecycleStatusSubmissionError = this.tenantsFacade.lifecycleStatusSubmissionError;
  readonly manualSettlementSubmitting = this.tenantsFacade.manualSettlementSubmitting;
  readonly manualSettlementError = this.tenantsFacade.manualSettlementError;
  readonly passwordChangeSubmitting = this.tenantsFacade.passwordChangeSubmitting;
  readonly passwordChangeError = this.tenantsFacade.passwordChangeError;
  readonly passwordChangeNotification = this.tenantsFacade.passwordChangeNotification;
  readonly showPassword = signal(false);
  readonly copyNotification = this.tenantsFacade.copyNotification;
  readonly isRtl = this.i18nService.isRtl;
  readonly impersonationError = signal<string | null>(null);
  t(text: string): string {
    return this.i18nService.t(text);
  }

  readonly selectedStatuses = this.tenantsFacade.selectedStatuses;
  readonly selectedPlans = this.tenantsFacade.selectedPlans;
  readonly selectedHealths = this.tenantsFacade.selectedHealths;

  readonly statuses = this.tenantsFacade.statuses;
  readonly plans = this.tenantsFacade.plans;
  readonly healths = this.tenantsFacade.healths;
  readonly activeFilterCount = this.tenantsFacade.activeFilterCount;
  readonly filteredTenants = this.tenantsFacade.filteredTenants;
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly pageSizeOptions = [10, 25, 50, 100];
  readonly totalItems = computed(() => this.filteredTenants().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.pageSize())));
  readonly currentPageDisplay = computed(() => Math.min(this.currentPage(), this.totalPages()));
  readonly pagedTenants = computed(() => {
    const page = this.currentPageDisplay();
    const start = (page - 1) * this.pageSize();
    return this.filteredTenants().slice(start, start + this.pageSize());
  });
  readonly shownStart = computed(() => (this.totalItems() === 0 ? 0 : ((this.currentPageDisplay() - 1) * this.pageSize()) + 1));
  readonly shownEnd = computed(() => Math.min(this.currentPageDisplay() * this.pageSize(), this.totalItems()));
  readonly filtersSearchQuery = signal('');
  readonly filteredStatuses = computed(() => this.filterPanelOptions(this.statuses()));
  readonly filteredPlans = computed(() => this.filterPanelOptions(this.plans));
  readonly filteredHealths = computed(() => this.filterPanelOptions(this.healths));
  readonly manualSettlementForm = this.fb.group({
    paymentTransactionRef: [''],
    manualInvoiceRef: ['', [Validators.required, Validators.maxLength(120)]],
    manualPaymentRef: ['', [Validators.required, Validators.maxLength(120)]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    currency: ['EGP', [Validators.required, Validators.maxLength(8)]],
    settledAt: ['', [Validators.required]],
    evidenceRef: [''],
    evidenceNote: [''],
    note: [''],
  });
  readonly passwordForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(120)]],
    confirmPassword: ['', [Validators.required]],
  });

  constructor() {
    effect(() => {
      this.searchQuery();
      this.selectedStatuses();
      this.selectedPlans();
      this.selectedHealths();
      this.currentPage.set(1);
    });
  }

  ngOnInit(): void {
    void this.tenantsData.loadFromBackend().catch(() => undefined);
  }

  getStatusColor(status: string): string {
    return this.statusesData.findByName(status)?.color ?? '#64748b';
  }

  formatBackendStatus(value: string): string {
    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  subscriptionBadgeClasses(subscriptionType: TenantSubscriptionType): Record<string, boolean> {
    return {
      'bg-amber-100 text-amber-700': subscriptionType === 'trial',
      'bg-emerald-100 text-emerald-700': subscriptionType === 'production',
    };
  }

  toggleFilter(type: 'status' | 'plan' | 'health', value: string): void {
    this.tenantsFacade.toggleFilter(type, value);
  }

  clearFilters(): void {
    this.tenantsFacade.clearFilters();
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((value) => value - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((value) => value + 1);
    }
  }

  onPageSizeChange(value: number | string): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }
    this.pageSize.set(parsed);
    this.currentPage.set(1);
  }

  toggleFiltersDropdown(): void {
    const next = !this.showFiltersDropdown();
    this.showFiltersDropdown.set(next);
    if (!next) {
      this.filtersSearchQuery.set('');
    }
  }

  closeFiltersDropdown(): void {
    this.showFiltersDropdown.set(false);
    this.filtersSearchQuery.set('');
  }

  async impersonate(tenant: Tenant): Promise<void> {
    try {
      this.impersonationError.set(null);
      this.dashboardService.returnUrl.set(this.router.url);
      await this.tenantImpersonationService.start(tenant.id, tenant.name, this.router.url);
      await this.router.navigate(['/tenant/overview']);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tenant impersonation could not be started.';
      this.impersonationError.set(message);
    }
  }

  requestStatusChange(tenant: Tenant, newStatus: string): void {
    this.tenantsFacade.requestStatusChange(tenant, newStatus);
  }

  async confirmStatusChange(): Promise<void> {
    await this.tenantsFacade.confirmStatusChange();
  }

  cancelStatusChange(): void {
    this.tenantsFacade.cancelStatusChange();
  }

  isLifecycleStatusPending(tenantId: string): boolean {
    return this.tenantsFacade.isLifecycleStatusPending(tenantId);
  }

  requestPlanChange(tenant: Tenant, newPlan: string): void {
    this.tenantsFacade.requestPlanChange(tenant, newPlan);
  }

  confirmPlanChange(): void {
    this.tenantsFacade.confirmPlanChange();
  }

  cancelPlanChange(): void {
    this.tenantsFacade.cancelPlanChange();
  }

  canManualSettle(tenant: Tenant): boolean {
    return this.tenantsFacade.canManualSettle(tenant);
  }

  openManualSettlement(tenant: Tenant): void {
    this.tenantsFacade.requestManualSettlement(tenant);
    if (this.pendingManualSettlement()) {
      this.manualSettlementForm.reset({
        paymentTransactionRef: '',
        manualInvoiceRef: '',
        manualPaymentRef: '',
        amount: null,
        currency: 'EGP',
        settledAt: this.toDateTimeLocal(new Date()),
        evidenceRef: '',
        evidenceNote: '',
        note: '',
      });
    }
  }

  closeManualSettlement(): void {
    this.tenantsFacade.cancelManualSettlement();
  }

  async submitManualSettlement(): Promise<void> {
    if (this.manualSettlementForm.invalid) {
      this.manualSettlementForm.markAllAsTouched();
      return;
    }

    const raw = this.manualSettlementForm.getRawValue();
    const payload: ManualSettlementRequest = {
      paymentTransactionRef: raw.paymentTransactionRef || null,
      manualInvoiceRef: raw.manualInvoiceRef || '',
      manualPaymentRef: raw.manualPaymentRef || '',
      amount: raw.amount ?? 0,
      currency: raw.currency || '',
      settledAt: new Date(raw.settledAt || '').toISOString(),
      evidenceRef: raw.evidenceRef || null,
      evidenceNote: raw.evidenceNote || null,
      note: raw.note || null,
    };

    const success = await this.tenantsFacade.submitManualSettlement(payload);
    if (success) {
      this.manualSettlementForm.reset({
        paymentTransactionRef: '',
        manualInvoiceRef: '',
        manualPaymentRef: '',
        amount: null,
        currency: 'EGP',
        settledAt: '',
        evidenceRef: '',
        evidenceNote: '',
        note: '',
      });
    }
  }

  hasManualSettlementFieldError(fieldName: keyof typeof this.manualSettlementForm.controls): boolean {
    const control = this.manualSettlementForm.controls[fieldName];
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  openPasswordChange(tenant: Tenant): void {
    this.passwordForm.reset({ newPassword: '', confirmPassword: '' });
    this.showPassword.set(false);
    this.tenantsFacade.requestPasswordChange(tenant);
  }

  closePasswordChange(): void {
    this.tenantsFacade.cancelPasswordChange();
  }

  async submitPasswordChange(): Promise<void> {
    if (this.passwordForm.invalid || this.passwordsDoNotMatch()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const value = this.passwordForm.getRawValue();
    const changed = await this.tenantsFacade.submitPasswordChange(
      value.newPassword ?? '',
      value.confirmPassword ?? '',
    );
    if (changed) {
      this.passwordForm.reset({ newPassword: '', confirmPassword: '' });
      setTimeout(() => this.tenantsFacade.clearPasswordChangeNotification(), 4000);
    }
  }

  passwordsDoNotMatch(): boolean {
    const value = this.passwordForm.getRawValue();
    return !!value.confirmPassword && value.newPassword !== value.confirmPassword;
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copyNotification.set(text);
      setTimeout(() => {
        if (this.copyNotification() === text) {
          this.copyNotification.set(null);
        }
      }, 2000);
    });
  }

  private filterPanelOptions(options: readonly string[]): string[] {
    const query = this.filtersSearchQuery().trim().toLowerCase();
    if (!query) {
      return [...options];
    }

    return options.filter((option) => option.toLowerCase().includes(query));
  }

  private toDateTimeLocal(value: Date): string {
    const pad = (input: number) => String(input).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }
}
