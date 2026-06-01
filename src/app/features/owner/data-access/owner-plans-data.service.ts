import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { Plan } from '../models/owner-plans.models';

type PlanStatus = 'Active' | 'Archived' | 'Draft';
type PlanVisibility = 'Public' | 'Private';
type PlanCurrency = 'USD' | 'EUR' | 'EGP';

interface PlanResponse {
  id: string;
  name: string;
  description?: string;
  status: PlanStatus;
  visibility: PlanVisibility;
  currency: PlanCurrency;
  audienceType?: 'center' | 'teacher';
  monthlyPrice: number;
  yearlyPrice: number;
  hasTrial?: boolean;
  trialDays: number;
  maxStudents: number;
  maxTeachers?: number;
  maxStorage: number;
  maxBranches?: number;
  moduleIds?: string[];
  autoRenew?: boolean;
  allowDowngrade?: boolean;
  isRecommended?: boolean;
  showAnnualPrice?: boolean;
}

@Injectable({ providedIn: 'root' })
export class OwnerPlansDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);

  readonly plans = signal<Plan[]>([]);

  constructor() {
    void this.refreshPlans();
  }

  async refreshPlans(): Promise<void> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<PlanResponse[]>(`${environment.apiBaseUrl}/plan-catalog/plans`));

    this.plans.set(response.map((plan) => ({
      id: plan.id,
      name: plan.name,
      audienceType: plan.audienceType ?? 'center',
      status: plan.status,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      currency: plan.currency === 'USD' ? '$' : plan.currency === 'EUR' ? '€' : 'LE ',
      maxStudents: plan.maxStudents,
      maxStorage: plan.maxStorage,
      trialDays: plan.trialDays,
      visibility: plan.visibility,
      moduleIds: plan.moduleIds ?? [],
      isRecommended: !!plan.isRecommended,
      showAnnualPrice: !!plan.showAnnualPrice,
    })));
  }

  async setPlanStatus(planId: string, status: PlanStatus): Promise<void> {
    await this.authApi.ensureLoggedIn();
    const existing = await firstValueFrom(
      this.http.get<PlanResponse>(`${environment.apiBaseUrl}/plan-catalog/plans/${planId}`)
    );

    await firstValueFrom(
      this.http.put(`${environment.apiBaseUrl}/plan-catalog/plans/${planId}`, {
        name: existing.name,
        description: existing.description ?? '',
        status,
        visibility: existing.visibility,
        currency: existing.currency,
        audienceType: existing.audienceType ?? 'center',
        monthlyPrice: existing.monthlyPrice,
        yearlyPrice: existing.yearlyPrice,
        hasTrial: existing.hasTrial ?? false,
        trialDays: existing.trialDays,
        maxStudents: existing.maxStudents,
        maxTeachers: existing.maxTeachers ?? 0,
        maxStorage: existing.maxStorage,
        maxBranches: existing.maxBranches ?? 0,
        moduleIds: existing.moduleIds ?? [],
        autoRenew: existing.autoRenew ?? false,
        allowDowngrade: existing.allowDowngrade ?? false,
        isRecommended: existing.isRecommended ?? false,
        showAnnualPrice: existing.showAnnualPrice ?? false,
      })
    );

    await this.refreshPlans();
  }

  async setPlanVisibility(planId: string, visibility: PlanVisibility): Promise<void> {
    await this.authApi.ensureLoggedIn();
    const existing = await firstValueFrom(
      this.http.get<PlanResponse>(`${environment.apiBaseUrl}/plan-catalog/plans/${planId}`)
    );

    await firstValueFrom(
      this.http.put(`${environment.apiBaseUrl}/plan-catalog/plans/${planId}`, {
        name: existing.name,
        description: existing.description ?? '',
        status: existing.status,
        visibility,
        currency: existing.currency,
        audienceType: existing.audienceType ?? 'center',
        monthlyPrice: existing.monthlyPrice,
        yearlyPrice: existing.yearlyPrice,
        hasTrial: existing.hasTrial ?? false,
        trialDays: existing.trialDays,
        maxStudents: existing.maxStudents,
        maxTeachers: existing.maxTeachers ?? 0,
        maxStorage: existing.maxStorage,
        maxBranches: existing.maxBranches ?? 0,
        moduleIds: existing.moduleIds ?? [],
        autoRenew: existing.autoRenew ?? false,
        allowDowngrade: existing.allowDowngrade ?? false,
        isRecommended: existing.isRecommended ?? false,
        showAnnualPrice: existing.showAnnualPrice ?? false,
      })
    );

    await this.refreshPlans();
  }

  async setPlanRecommended(planId: string, isRecommended: boolean): Promise<void> {
    await this.authApi.ensureLoggedIn();
    const existing = await firstValueFrom(
      this.http.get<PlanResponse>(`${environment.apiBaseUrl}/plan-catalog/plans/${planId}`)
    );

    await firstValueFrom(
      this.http.put(`${environment.apiBaseUrl}/plan-catalog/plans/${planId}`, {
        name: existing.name,
        description: existing.description ?? '',
        status: existing.status,
        visibility: existing.visibility,
        currency: existing.currency,
        audienceType: existing.audienceType ?? 'center',
        monthlyPrice: existing.monthlyPrice,
        yearlyPrice: existing.yearlyPrice,
        hasTrial: existing.hasTrial ?? false,
        trialDays: existing.trialDays,
        maxStudents: existing.maxStudents,
        maxTeachers: existing.maxTeachers ?? 0,
        maxStorage: existing.maxStorage,
        maxBranches: existing.maxBranches ?? 0,
        moduleIds: existing.moduleIds ?? [],
        autoRenew: existing.autoRenew ?? false,
        allowDowngrade: existing.allowDowngrade ?? false,
        isRecommended,
        showAnnualPrice: existing.showAnnualPrice ?? false,
      })
    );

    await this.refreshPlans();
  }

  async setPlanShowAnnualPrice(planId: string, showAnnualPrice: boolean): Promise<void> {
    await this.authApi.ensureLoggedIn();
    const existing = await firstValueFrom(
      this.http.get<PlanResponse>(`${environment.apiBaseUrl}/plan-catalog/plans/${planId}`)
    );

    await firstValueFrom(
      this.http.put(`${environment.apiBaseUrl}/plan-catalog/plans/${planId}`, {
        name: existing.name,
        description: existing.description ?? '',
        status: existing.status,
        visibility: existing.visibility,
        currency: existing.currency,
        audienceType: existing.audienceType ?? 'center',
        monthlyPrice: existing.monthlyPrice,
        yearlyPrice: existing.yearlyPrice,
        hasTrial: existing.hasTrial ?? false,
        trialDays: existing.trialDays,
        maxStudents: existing.maxStudents,
        maxTeachers: existing.maxTeachers ?? 0,
        maxStorage: existing.maxStorage,
        maxBranches: existing.maxBranches ?? 0,
        moduleIds: existing.moduleIds ?? [],
        autoRenew: existing.autoRenew ?? false,
        allowDowngrade: existing.allowDowngrade ?? false,
        isRecommended: existing.isRecommended ?? false,
        showAnnualPrice,
      })
    );

    await this.refreshPlans();
  }
}
