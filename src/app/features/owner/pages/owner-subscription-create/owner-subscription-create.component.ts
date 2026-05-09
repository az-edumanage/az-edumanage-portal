import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { SubscriptionPresetService } from '../../../../core/services/subscription-preset.service';
import { OwnerSettingsDataService } from '../../data-access/owner-settings-data.service';
import { OwnerPlanCreateDataService } from '../../data-access/owner-plan-create-data.service';
import { OwnerModuleCatalogApiService } from '../../data-access/owner-modulecatalog-api.service';
import { OwnerSubscriptionTemplatesDataService } from '../../data-access/owner-subscription-templates-data.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-owner-subscription-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './owner-subscription-create.component.html',
  styleUrl: './owner-subscription-create.component.css'})
export class OwnerSubscriptionCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private presetService = inject(SubscriptionPresetService);
  private ownerSettingsData = inject(OwnerSettingsDataService);
  private ownerPlanCreateData = inject(OwnerPlanCreateDataService);
  private ownerModuleCatalogApi = inject(OwnerModuleCatalogApiService);
  private ownerSubscriptionTemplatesData = inject(OwnerSubscriptionTemplatesDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private isLoadingCycles = false;
  private isLoadingPlanPricing = false;
  private selectedPlanModulesPrice = 0;

  activeCycles = signal(this.presetService.cycles().filter(c => c.active));
  activeMethods = signal(this.presetService.paymentMethods().filter(m => m.active));

  availablePlans = signal<Array<{ id: string; name: string }>>([]);
  basePrice = signal(0);
  isSubmitting = signal(false);
  saveStatus = signal<{ type: 'success' | 'error'; title: string; message: string } | null>(null);
  editingTemplateId = signal<string | null>(null);

  subForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    gracePeriod: [0, [Validators.min(0)]],
    billingCycle: ['', Validators.required],
    customDuration: [0],
    selectedPlanId: ['', Validators.required],
    selectedMethods: this.fb.array([], Validators.required),
    discountType: ['none'],
    discountValue: [0, [Validators.min(0)]],
    finalPrice: [0, [Validators.min(0)]],
    autoRenew: [true],
    
    // Advanced Policy & Access Control
    allowDashboardAfterExpiry: [true],
    allowReportsAfterExpiry: [false],
    restrictedModulesAfterExpiry: [''],
    allowLoginAfterGrace: [false],
    readOnlyAfterGrace: [true],
    graceBlockMessage: ['Your subscription has been suspended. Please contact support.'],
    
    // Status Transitions
    statusOnExpiry: ['Past Due'],
    statusAfterGrace: ['Suspended'],
    
    // Notifications
    preExpiryDays: [7],
    preExpiryMessage: ['Your subscription will expire in {days} days. Please renew to ensure continuous service.'],
    onExpiryMessage: ['Your subscription has expired. You are now in the grace period.'],
    preGraceDays: [3],
    preGraceMessage: ['Your grace period will end in {days} days. Access will be restricted.'],
    onGraceMessage: ['Your grace period has ended. Service has been suspended.']
  });

  ngOnInit(): void {
    void this.initializeFormData();
    interval(10000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        void this.loadSubscriptionCycles();
      });

    this.subForm.get('discountType')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateTotalPriceFromDiscount());

    this.subForm.get('discountValue')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateTotalPriceFromDiscount());

    this.subForm.get('billingCycle')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recalculatePricingFromDuration());

    this.subForm.get('customDuration')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recalculatePricingFromDuration());
  }

  private async initializeFormData(): Promise<void> {
    await Promise.all([this.loadSubscriptionCycles(), this.loadPlans()]);
    const templateId = this.route.snapshot.paramMap.get('id');
    if (templateId) {
      this.editingTemplateId.set(templateId);
      await this.loadTemplateForEdit(templateId);
    }
  }

  get isDurationEnabled(): boolean {
    return this.subForm.get('name')?.value?.trim()?.length > 0;
  }

  get isPlansEnabled(): boolean {
    return this.isDurationEnabled && !!this.subForm.get('billingCycle')?.value;
  }

  get isRemainingSectionsEnabled(): boolean {
    return this.isPlansEnabled && !!this.subForm.get('selectedPlanId')?.value;
  }

  get backRoute(): string {
    return this.editingTemplateId() ? '/owner/subscriptions/templates' : '/owner/subscriptions';
  }

  get selectedMethodsArray() {
    return this.subForm.get('selectedMethods') as FormArray;
  }

  isPlanSelected(id: string): boolean {
    return this.subForm.get('selectedPlanId')?.value === id;
  }

  togglePlan(id: string) {
    this.subForm.patchValue({ selectedPlanId: id });
    void this.loadSelectedPlanPricing(id);
  }

  isMethodSelected(name: string): boolean {
    return this.selectedMethodsArray.value.includes(name);
  }

  isAllMethodsSelected(): boolean {
    const active = this.activeMethods();
    return this.selectedMethodsArray.length === active.length && active.length > 0;
  }

  toggleAllMethods() {
    const allSelected = this.isAllMethodsSelected();
    const active = this.activeMethods();
    this.selectedMethodsArray.clear();
    if (!allSelected) {
      active.forEach(method => this.selectedMethodsArray.push(this.fb.control(method.name)));
    }
  }

  toggleMethod(name: string) {
    const index = this.selectedMethodsArray.value.indexOf(name);
    if (index === -1) {
      this.selectedMethodsArray.push(this.fb.control(name));
    } else {
      this.selectedMethodsArray.removeAt(index);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.subForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    try {
      const payload = {
        name: String(this.subForm.get('name')?.value ?? '').trim(),
        gracePeriod: this.normalizeNumber(this.subForm.get('gracePeriod')?.value),
        billingCycle: String(this.subForm.get('billingCycle')?.value ?? ''),
        customDuration: this.normalizeNumber(this.subForm.get('customDuration')?.value),
        selectedPlanId: String(this.subForm.get('selectedPlanId')?.value ?? ''),
        selectedMethods: (this.selectedMethodsArray.value ?? []) as string[],
        discountType: this.subForm.get('discountType')?.value as 'none' | 'percentage' | 'fixed',
        discountValue: this.normalizeNumber(this.subForm.get('discountValue')?.value),
        basePrice: this.basePrice(),
        finalPrice: this.normalizeNumber(this.subForm.get('finalPrice')?.value),
        totalPrice: this.totalPrice,
        status: 'Active' as const,
      };

      const editingId = this.editingTemplateId();
      if (editingId) {
        await this.ownerSubscriptionTemplatesData.updateTemplate(editingId, payload);
      } else {
        await this.ownerSubscriptionTemplatesData.createTemplate(payload);
      }
      this.saveStatus.set({
        type: 'success',
        title: 'Saved Successfully',
        message: this.editingTemplateId() ? 'Template updated successfully.' : 'Template created successfully.',
      });
    } catch (error) {
      this.saveStatus.set({
        type: 'error',
        title: 'Save Failed',
        message: this.resolveRootCauseMessage(error),
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async loadSubscriptionCycles(): Promise<void> {
    if (this.isLoadingCycles) {
      return;
    }

    this.isLoadingCycles = true;
    try {
      const cycles = await this.ownerSettingsData.fetchSubscriptionCycles();
      this.activeCycles.set(cycles.filter((cycle) => cycle.active));
      this.presetService.updateCycles(cycles);
    } catch {
      this.activeCycles.set(this.presetService.cycles().filter((cycle) => cycle.active));
    } finally {
      this.isLoadingCycles = false;
    }
  }

  private async loadPlans(): Promise<void> {
    try {
      const plans = await this.ownerPlanCreateData.listPlans();
      this.availablePlans.set(plans);
    } catch {
      this.availablePlans.set([]);
    }
  }

  private async loadTemplateForEdit(templateId: string): Promise<void> {
    try {
      const template = await this.ownerSubscriptionTemplatesData.fetchTemplateById(templateId);

      this.subForm.patchValue({
        name: template.name ?? '',
        gracePeriod: this.normalizeNumber(template.gracePeriod),
        billingCycle: template.billingCycle ?? '',
        selectedPlanId: template.selectedPlanId ?? '',
        discountType: (template.discountType as 'none' | 'percentage' | 'fixed') ?? 'none',
        discountValue: this.normalizeNumber(template.discountValue),
      }, { emitEvent: false });

      this.selectedMethodsArray.clear();
      for (const method of template.selectedMethods ?? []) {
        this.selectedMethodsArray.push(this.fb.control(method));
      }

      if (template.selectedPlanId) {
        await this.loadSelectedPlanPricing(template.selectedPlanId);
      }

      if (typeof template.basePrice === 'number') {
        this.basePrice.set(this.normalizeNumber(template.basePrice));
      }

      if (typeof template.finalPrice === 'number') {
        this.subForm.patchValue({ finalPrice: this.normalizeNumber(template.finalPrice) }, { emitEvent: false });
      }
    } catch {
      this.saveStatus.set({
        type: 'error',
        title: 'Load Failed',
        message: 'Unable to load template data for editing.',
      });
    }
  }

  private async loadSelectedPlanPricing(planId: string): Promise<void> {
    if (!planId || this.isLoadingPlanPricing) {
      return;
    }

    this.isLoadingPlanPricing = true;
    try {
      const [plan, modules] = await Promise.all([
        this.ownerPlanCreateData.getPlanById(planId),
        this.ownerModuleCatalogApi.listModules(),
      ]);

      const modulePriceById = new Map(modules.map((module) => [module.id, module.price ?? 0]));
      this.selectedPlanModulesPrice = (plan?.moduleIds ?? []).reduce(
        (sum, moduleId) => sum + (modulePriceById.get(moduleId) ?? 0),
        0,
      );
      this.recalculatePricingFromDuration();
    } catch {
      this.selectedPlanModulesPrice = 0;
      this.basePrice.set(0);
      this.subForm.patchValue({ finalPrice: 0 }, { emitEvent: false });
      this.updateTotalPriceFromDiscount();
    } finally {
      this.isLoadingPlanPricing = false;
    }
  }

  get totalPrice(): number {
    const finalPrice = this.normalizeNumber(this.subForm.get('finalPrice')?.value);
    const discountType = this.subForm.get('discountType')?.value as 'none' | 'percentage' | 'fixed';
    const discountValue = this.normalizeNumber(this.subForm.get('discountValue')?.value);

    if (discountType === 'percentage') {
      return Math.max(0, finalPrice - (finalPrice * discountValue / 100));
    }
    if (discountType === 'fixed') {
      return Math.max(0, finalPrice - discountValue);
    }
    return finalPrice;
  }

  private updateTotalPriceFromDiscount(): void {
    // Triggers template refresh when discount/finalPrice changes.
    this.subForm.patchValue({ finalPrice: this.normalizeNumber(this.subForm.get('finalPrice')?.value) }, { emitEvent: false });
  }

  private recalculatePricingFromDuration(): void {
    const durationDays = this.getSelectedDurationDays();
    if (durationDays <= 0 || this.selectedPlanModulesPrice <= 0) {
      this.basePrice.set(0);
      this.subForm.patchValue({ finalPrice: 0 }, { emitEvent: false });
      this.updateTotalPriceFromDiscount();
      return;
    }

    const dailyPrice = this.selectedPlanModulesPrice / 30;
    const calculatedBase = dailyPrice * durationDays;
    this.basePrice.set(Number(calculatedBase.toFixed(2)));
    this.subForm.patchValue({ finalPrice: Number(calculatedBase.toFixed(2)) }, { emitEvent: false });
    this.updateTotalPriceFromDiscount();
  }

  private getSelectedDurationDays(): number {
    const cycleName = String(this.subForm.get('billingCycle')?.value ?? '').trim();
    if (!cycleName) {
      return 0;
    }
    if (cycleName === 'Custom') {
      return Math.max(0, this.normalizeNumber(this.subForm.get('customDuration')?.value));
    }

    const selectedCycle = this.activeCycles().find((cycle) => cycle.name === cycleName);
    return Math.max(0, this.normalizeNumber(selectedCycle?.days));
  }

  private normalizeNumber(value: unknown): number {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
  }

  closeSaveStatus(): void {
    const status = this.saveStatus();
    this.saveStatus.set(null);
    if (status?.type === 'success') {
      this.router.navigate(['/owner/subscriptions/templates']);
    }
  }

  private resolveRootCauseMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const payload = error.error as { message?: string; details?: unknown } | null;
      const details = Array.isArray(payload?.details)
        ? payload.details.filter((v) => typeof v === 'string').join(' | ')
        : '';
      const message = payload?.message || error.message || `HTTP ${error.status}`;
      return details ? `${message} (${details})` : message;
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'Unexpected server error';
  }
}
