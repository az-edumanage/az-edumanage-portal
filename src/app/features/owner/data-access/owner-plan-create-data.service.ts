import { Injectable } from '@angular/core';
import { map, Observable, timer } from 'rxjs';
import {
  OwnerPlanCreatePayload,
  OwnerPlanCurrencyOption,
  OwnerPlanEditSeed,
  OwnerPlanOption,
  OwnerPlanVisibilityOption,
} from '../models/owner-plan-create.models';

@Injectable({ providedIn: 'root' })
export class OwnerPlanCreateDataService {
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

  readonly existingPlans = [
    { id: 'pln_starter', name: 'Starter' },
    { id: 'pln_pro', name: 'Professional' },
    { id: 'pln_enterprise', name: 'Enterprise' },
  ];

  getPlanById(planId: string): OwnerPlanEditSeed | null {
    const plans: OwnerPlanEditSeed[] = [
      {
        id: 'pln_starter',
        name: 'Starter',
        status: 'Active',
        monthlyPrice: 49,
        yearlyPrice: 490,
        currency: 'USD',
        maxStudents: 200,
        maxTeachers: 10,
        maxStorage: 5,
        maxBranches: 1,
        visibility: 'Public',
        description: 'Perfect for small schools starting their digital journey.',
        hasTrial: true,
        trialDays: 14,
        autoRenew: true,
        allowDowngrade: false,
        modules: {
          academicStructure: true,
          studentsManagement: true,
          scheduling: true,
          usersManagement: true,
          auditLogs: true,
          examsAndGrades: false,
          finance: false,
          smsIntegration: false,
          advancedAnalytics: false,
          parentPortal: false,
          lms: false,
          questionBank: false,
        },
      },
      {
        id: 'pln_pro',
        name: 'Professional',
        status: 'Active',
        monthlyPrice: 149,
        yearlyPrice: 1490,
        currency: 'USD',
        maxStudents: 1000,
        maxTeachers: 50,
        maxStorage: 50,
        maxBranches: 5,
        visibility: 'Public',
        description: 'Advanced features for growing institutions.',
        hasTrial: true,
        trialDays: 14,
        autoRenew: true,
        allowDowngrade: false,
        modules: {
          academicStructure: true,
          studentsManagement: true,
          scheduling: true,
          usersManagement: true,
          auditLogs: true,
          examsAndGrades: true,
          finance: true,
          smsIntegration: true,
          advancedAnalytics: false,
          parentPortal: false,
          lms: false,
          questionBank: false,
        },
      },
      {
        id: 'pln_enterprise',
        name: 'Enterprise',
        status: 'Active',
        monthlyPrice: 499,
        yearlyPrice: 4990,
        currency: 'USD',
        maxStudents: 10000,
        maxTeachers: 500,
        maxStorage: 500,
        maxBranches: 20,
        visibility: 'Private',
        description: 'Full power for large educational networks.',
        hasTrial: true,
        trialDays: 14,
        autoRenew: true,
        allowDowngrade: false,
        modules: {
          academicStructure: true,
          studentsManagement: true,
          scheduling: true,
          usersManagement: true,
          auditLogs: true,
          examsAndGrades: true,
          finance: true,
          smsIntegration: true,
          advancedAnalytics: true,
          parentPortal: true,
          lms: true,
          questionBank: true,
        },
      },
    ];

    return plans.find((plan) => plan.id === planId) ?? null;
  }

  isPlanNameTaken(name: string, currentPlanId: string | null): { source: string } | null {
    const normalized = name.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    const existing = this.existingPlans.find((plan) => {
      if (currentPlanId && plan.id === currentPlanId) {
        return false;
      }

      return plan.name.toLowerCase() === normalized;
    });

    if (!existing) {
      return null;
    }

    return { source: existing.name };
  }

  createOrUpdatePlan(payload: OwnerPlanCreatePayload): Observable<void> {
    void payload;
    return timer(1000).pipe(map(() => void 0));
  }
}
