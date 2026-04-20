import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { SubscriptionPresetService } from '../../../../core/services/subscription-preset.service';

@Component({
  selector: 'app-owner-subscription-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './owner-subscription-create.component.html',
  styleUrl: './owner-subscription-create.component.css'})
export class OwnerSubscriptionCreateComponent {
  private fb = inject(FormBuilder);
  private presetService = inject(SubscriptionPresetService);
  private router = inject(Router);

  activeCycles = signal(this.presetService.cycles().filter(c => c.active));
  activeMethods = signal(this.presetService.paymentMethods().filter(m => m.active));

  availablePlans = [
    { id: 'p1', name: 'Starter Plan' },
    { id: 'p2', name: 'Professional Plan' },
    { id: 'p3', name: 'Enterprise Plan' },
    { id: 'p4', name: 'Custom Module Pack' },
  ];

  subForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    gracePeriod: [0, [Validators.min(0)]],
    billingCycle: ['', Validators.required],
    customDuration: [0],
    selectedPlans: this.fb.array([], Validators.required),
    selectedMethods: this.fb.array([], Validators.required),
    discountType: ['none'],
    discountValue: [0, [Validators.min(0)]],
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

  get selectedPlansArray() {
    return this.subForm.get('selectedPlans') as FormArray;
  }

  get selectedMethodsArray() {
    return this.subForm.get('selectedMethods') as FormArray;
  }

  isPlanSelected(id: string): boolean {
    return this.selectedPlansArray.value.includes(id);
  }

  isAllPlansSelected(): boolean {
    return this.selectedPlansArray.length === this.availablePlans.length && this.availablePlans.length > 0;
  }

  toggleAllPlans() {
    const allSelected = this.isAllPlansSelected();
    this.selectedPlansArray.clear();
    if (!allSelected) {
      this.availablePlans.forEach(plan => this.selectedPlansArray.push(this.fb.control(plan.id)));
    }
  }

  togglePlan(id: string) {
    const index = this.selectedPlansArray.value.indexOf(id);
    if (index === -1) {
      this.selectedPlansArray.push(this.fb.control(id));
    } else {
      this.selectedPlansArray.removeAt(index);
    }
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

  onSubmit() {
    if (this.subForm.valid) {
      console.log('Saving Subscription Template:', this.subForm.value);
      this.router.navigate(['/owner/subscriptions']);
    }
  }
}
