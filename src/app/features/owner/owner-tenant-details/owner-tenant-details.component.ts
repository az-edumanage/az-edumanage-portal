import { Component, inject, signal } from '@angular/core';
import { CommonModule, TitleCasePipe, Location } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-owner-tenant-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TitleCasePipe],
  templateUrl: './owner-tenant-details.component.html'})
export class OwnerTenantDetailsComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private dashboardService = inject(DashboardService);
  
  showPlanDropdown = signal(false);
  pendingPlanId = signal<string | null>(null);
  isUpgrading = signal(false);

  plans = [
    { id: 'starter', name: 'Starter', price: '$49/mo' },
    { id: 'pro', name: 'Professional', price: '$149/mo' },
    { id: 'enterprise', name: 'Enterprise', price: 'Custom' }
  ];

  tenant = {
    id: 'tnt_001',
    centerName: 'Bright Future Academy',
    tenantType: 'Educational Center',
    subdomain: 'brightfuture',
    domain: '.remix.com',
    industry: 'K-12 School',
    contactName: 'John Doe',
    contactEmail: 'admin@brightfuture.edu',
    contactPhone: '+20 123 456 7890',
    address: '123 Education St',
    city: 'Cairo',
    country: 'Egypt',
    planId: 'enterprise',
    isTrial: true,
    trialDays: 14,
    region: 'me-south-1',
    autoProvision: true,
    sendInvite: true,
    onboardingLink: true,
    sendOnboardingWhatsapp: true,
    sendOnboardingEmail: false,
    status: 'Active',
    createdDate: 'Jan 15, 2024'
  };

  modules = ['Attendance', 'Exams', 'Billing', 'LMS', 'Reports', 'Parent Portal'];

  selectPlan(planId: string) {
    if (planId === this.tenant.planId) {
      this.pendingPlanId.set(null);
    } else {
      this.pendingPlanId.set(planId);
    }
    this.showPlanDropdown.set(false);
  }

  confirmUpgrade() {
    const newPlanId = this.pendingPlanId();
    if (newPlanId && !this.isUpgrading()) {
      this.isUpgrading.set(true);
      
      // Simulate API call
      setTimeout(() => {
        this.tenant.planId = newPlanId;
        this.pendingPlanId.set(null);
        this.isUpgrading.set(false);
        console.log(`Plan officially upgraded to: ${newPlanId}`);
      }, 1500);
    }
  }

  cancelUpgrade() {
    this.pendingPlanId.set(null);
  }

  getCurrentPlanPrice(): string {
    const plan = this.plans.find(p => p.id === this.tenant.planId);
    return plan ? plan.price : '';
  }

  getPendingPlanName(): string {
    const plan = this.plans.find(p => p.id === this.pendingPlanId());
    return plan ? plan.name : '';
  }

  impersonate() {
    // Save current URL to return back later
    this.dashboardService.returnUrl.set(this.router.url);

    // Navigate based on tenant type and update sidebar role
    if (this.tenant.tenantType === 'Individual Teacher') {
      this.dashboardService.setRole('teacher');
      this.router.navigate(['/teacher/overview']);
    } else {
      this.dashboardService.setRole('tenant');
      this.router.navigate(['/tenant/overview']);
    }
    console.log(`Impersonating tenant: ${this.tenant.centerName} (${this.tenant.tenantType})`);
  }

  goBack() {
    this.location.back();
  }
}
