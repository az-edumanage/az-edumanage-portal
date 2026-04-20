import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../../core/services/dashboard.service';

type TenantStatus = 'Active' | 'Suspended' | 'Trial' | 'Past Due' | 'Cancelled';

interface Tenant {
  id: string;
  name: string;
  status: TenantStatus;
  plan: string;
  createdDate: string;
  ownerEmail: string;
  healthStatus: 'Healthy' | 'Degraded' | 'Down';
  tenantType: string;
}

@Component({
  selector: 'app-owner-tenants-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-tenants-list.component.html'})
export class OwnerTenantsListComponent {
  private router = inject(Router);
  private dashboardService = inject(DashboardService);

  searchQuery = signal('');
  
  showFiltersDropdown = signal(false);
  activeStatusDropdown = signal<string | null>(null);
  pendingStatusChange = signal<{ tenant: Tenant, status: TenantStatus } | null>(null);
  activePlanDropdown = signal<string | null>(null);
  pendingPlanChange = signal<{ tenant: Tenant, plan: string } | null>(null);
  copyNotification = signal<string | null>(null);
  
  selectedStatuses = signal<Set<string>>(new Set());
  selectedPlans = signal<Set<string>>(new Set());
  selectedHealths = signal<Set<string>>(new Set());

  statuses = ['Active', 'Trial', 'Past Due', 'Suspended', 'Cancelled'];
  plans = ['Starter', 'Professional', 'Enterprise'];
  healths = ['Healthy', 'Degraded', 'Down'];

  activeFilterCount = computed(() => {
    return this.selectedStatuses().size + this.selectedPlans().size + this.selectedHealths().size;
  });

  toggleFilter(type: 'status' | 'plan' | 'health', value: string) {
    const set = type === 'status' ? this.selectedStatuses() : type === 'plan' ? this.selectedPlans() : this.selectedHealths();
    const newSet = new Set(set);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    
    if (type === 'status') this.selectedStatuses.set(newSet);
    else if (type === 'plan') this.selectedPlans.set(newSet);
    else this.selectedHealths.set(newSet);
  }

  clearFilters() {
    this.selectedStatuses.set(new Set());
    this.selectedPlans.set(new Set());
    this.selectedHealths.set(new Set());
  }
  
  tenants: Tenant[] = [
    { id: 'tnt_001', name: 'Bright Future Academy', status: 'Active', plan: 'Enterprise', createdDate: 'Jan 15, 2024', ownerEmail: 'admin@brightfuture.edu', healthStatus: 'Healthy', tenantType: 'Educational Center' },
    { id: 'tnt_002', name: 'Cairo Math Center', status: 'Trial', plan: 'Professional', createdDate: 'Feb 02, 2024', ownerEmail: 'contact@cairomath.com', healthStatus: 'Healthy', tenantType: 'Educational Center' },
    { id: 'tnt_003', name: 'Elite Tutors', status: 'Active', plan: 'Starter', createdDate: 'Dec 10, 2023', ownerEmail: 'sarah@elitetutors.net', healthStatus: 'Degraded', tenantType: 'Individual Teacher' },
    { id: 'tnt_004', name: 'Physics Pro', status: 'Active', plan: 'Professional', createdDate: 'Jan 20, 2024', ownerEmail: 'dr.ahmed@physicspro.com', healthStatus: 'Healthy', tenantType: 'Educational Center' },
    { id: 'tnt_005', name: 'Language Hub', status: 'Suspended', plan: 'Starter', createdDate: 'Nov 05, 2023', ownerEmail: 'info@langhub.org', healthStatus: 'Down', tenantType: 'Educational Center' },
  ];

  filteredTenants = computed(() => {
    const search = this.searchQuery().toLowerCase();
    const statuses = this.selectedStatuses();
    const plans = this.selectedPlans();
    const healths = this.selectedHealths();

    return this.tenants.filter(tenant => {
      const matchesSearch = !search || 
                            tenant.name.toLowerCase().includes(search) || 
                            tenant.id.toLowerCase().includes(search) ||
                            tenant.ownerEmail.toLowerCase().includes(search);
      const matchesStatus = statuses.size === 0 || statuses.has(tenant.status);
      const matchesPlan = plans.size === 0 || plans.has(tenant.plan);
      const matchesHealth = healths.size === 0 || healths.has(tenant.healthStatus);

      return matchesSearch && matchesStatus && matchesPlan && matchesHealth;
    });
  });

  impersonate(tenant: Tenant) {
    // Save current URL to return back later
    this.dashboardService.returnUrl.set(this.router.url);

    // Navigate based on tenant type and update sidebar role
    if (tenant.tenantType === 'Individual Teacher') {
      this.dashboardService.setRole('teacher');
      this.router.navigate(['/teacher/overview']);
    } else {
      this.dashboardService.setRole('tenant');
      this.router.navigate(['/tenant/overview']);
    }
    console.log(`Impersonating tenant: ${tenant.name} (${tenant.tenantType})`);
  }

  requestStatusChange(tenant: Tenant, newStatus: string) {
    if (tenant.status === newStatus) return;
    this.pendingStatusChange.set({ tenant, status: newStatus as TenantStatus });
  }

  confirmStatusChange() {
    const pending = this.pendingStatusChange();
    if (pending) {
      pending.tenant.status = pending.status;
      console.log(`Confirmed status change of ${pending.tenant.name} to ${pending.status}`);
      this.pendingStatusChange.set(null);
    }
  }

  cancelStatusChange() {
    this.pendingStatusChange.set(null);
  }

  requestPlanChange(tenant: Tenant, newPlan: string) {
    if (tenant.plan === newPlan) return;
    this.pendingPlanChange.set({ tenant, plan: newPlan });
  }

  confirmPlanChange() {
    const pending = this.pendingPlanChange();
    if (pending) {
      pending.tenant.plan = pending.plan;
      console.log(`Confirmed plan change of ${pending.tenant.name} to ${pending.plan}`);
      this.pendingPlanChange.set(null);
    }
  }

  cancelPlanChange() {
    this.pendingPlanChange.set(null);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.copyNotification.set(text);
      setTimeout(() => {
        if (this.copyNotification() === text) {
          this.copyNotification.set(null);
        }
      }, 2000);
    });
  }

  changeStatus(tenant: Tenant, newStatus: string) {
    tenant.status = newStatus as TenantStatus;
    console.log(`Changed status of ${tenant.name} to ${newStatus}`);
  }
}
