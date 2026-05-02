import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  OwnerPlanCreatePayload,
  OwnerPlanCurrencyOption,
  OwnerPlanEditSeed,
  OwnerPlanModuleOption,
  OwnerPlanOption,
  OwnerPlanVisibilityOption,
} from '../models/owner-plan-create.models';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { OwnerModuleCatalogApiService } from './owner-modulecatalog-api.service';

interface PlanResponse {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Archived' | 'Draft';
  visibility: 'Public' | 'Private';
  currency: 'USD' | 'EUR' | 'EGP';
  monthlyPrice: number;
  yearlyPrice: number;
  hasTrial?: boolean;
  trialDays?: number;
  maxStudents: number;
  maxTeachers: number;
  maxStorage: number;
  maxBranches: number;
  moduleIds: string[];
  autoRenew: boolean;
  allowDowngrade: boolean;
}

@Injectable({ providedIn: 'root' })
export class OwnerPlanCreateDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly moduleApi = inject(OwnerModuleCatalogApiService);

  readonly statuses: OwnerPlanOption[] = [
    { id: 'Active', name: 'Active' },
    { id: 'Archived', name: 'Archived' },
    { id: 'Draft', name: 'Draft' },
  ];

  readonly visibilities: OwnerPlanVisibilityOption[] = [
    { value: 'Public', label: 'Public (Visible on Pricing Page)' },
    { value: 'Private', label: 'Private (Sales Only)' },
  ];

  readonly currencies: OwnerPlanCurrencyOption[] = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'EGP', label: 'EGP (LE)' },
  ];

  async listPlans(): Promise<{ id: string; name: string }[]> {
    await this.authApi.ensureLoggedIn();
    const plans = await firstValueFrom(this.http.get<PlanResponse[]>(`${environment.apiBaseUrl}/plan-catalog/plans`));
    return (plans ?? []).map((item) => ({ id: item.id, name: item.name }));
  }

  async listModuleOptions(): Promise<OwnerPlanModuleOption[]> {
    const modules = await this.moduleApi.listModules();
    return modules.map((moduleItem) => ({ id: moduleItem.id, name: moduleItem.name }));
  }

  async getPlanById(planId: string): Promise<OwnerPlanEditSeed | null> {
    await this.authApi.ensureLoggedIn();
    try {
      const plan = await firstValueFrom(this.http.get<PlanResponse>(`${environment.apiBaseUrl}/plan-catalog/plans/${planId}`));
      if (!plan) return null;
      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        status: plan.status,
        visibility: plan.visibility,
        currency: plan.currency,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        maxStudents: plan.maxStudents,
        maxTeachers: plan.maxTeachers,
        maxStorage: plan.maxStorage,
        maxBranches: plan.maxBranches,
        moduleIds: plan.moduleIds,
        autoRenew: plan.autoRenew,
        allowDowngrade: plan.allowDowngrade,
      };
    } catch {
      return null;
    }
  }

  isPlanNameTaken(name: string, currentPlanId: string | null, existingPlans: { id: string; name: string }[]): { source: string } | null {
    const normalized = name.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    const existing = existingPlans.find((plan) => {
      if (currentPlanId && plan.id === currentPlanId) {
        return false;
      }
      return plan.name.toLowerCase() === normalized;
    });

    return existing ? { source: existing.name } : null;
  }

  createOrUpdatePlan(payload: OwnerPlanCreatePayload, planId: string | null): Observable<void> {
    const request = this.savePlan(payload, planId);
    return from(request);
  }

  private async savePlan(payload: OwnerPlanCreatePayload, planId: string | null): Promise<void> {
    await this.authApi.ensureLoggedIn();
    if (planId) {
      await firstValueFrom(this.http.put(`${environment.apiBaseUrl}/plan-catalog/plans/${planId}`, payload));
      return;
    }
    await firstValueFrom(this.http.post(`${environment.apiBaseUrl}/plan-catalog/plans`, payload));
  }
}
