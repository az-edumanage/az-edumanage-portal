import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { SubscriptionTemplate } from '../models/owner-subscription-templates.models';

export interface SaveSubscriptionTemplatePayload {
  name: string;
  gracePeriod: number;
  billingCycle: string;
  customDuration: number;
  selectedPlanId: string;
  selectedMethods: string[];
  discountType: 'none' | 'percentage' | 'fixed';
  discountValue: number;
  basePrice: number;
  finalPrice: number;
  totalPrice: number;
  status: 'Active' | 'Draft' | 'Archived';
}

interface SubscriptionTemplateApiResponse {
  id: string;
  name: string;
  billingCycle: string;
  gracePeriod: number;
  plansCount: number;
  paymentMethodsCount: number;
  discount: string;
  status: 'Active' | 'Draft' | 'Archived';
  hasActiveSubscriptions: boolean;
  selectedPlanId?: string | null;
  selectedMethods?: string[];
  discountType?: 'none' | 'percentage' | 'fixed';
  discountValue?: number;
  basePrice?: number;
  finalPrice?: number;
  totalPrice?: number;
  createdAt?: string;
}

export type SubscriptionTemplateDetailsResponse = SubscriptionTemplateApiResponse;

@Injectable({ providedIn: 'root' })
export class OwnerSubscriptionTemplatesDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);

  readonly templates = signal<SubscriptionTemplate[]>([]);

  async refreshTemplates(): Promise<void> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<SubscriptionTemplateApiResponse[]>(
      `${environment.apiBaseUrl}/subscription-template-catalog/templates`,
    ));

    this.templates.set((response ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      billingCycle: item.billingCycle,
      gracePeriod: item.gracePeriod,
      plansCount: item.plansCount,
      paymentMethodsCount: item.paymentMethodsCount,
      discount: item.discount,
      status: item.status,
      hasActiveSubscriptions: item.hasActiveSubscriptions,
    })));
  }

  async createTemplate(payload: SaveSubscriptionTemplatePayload): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.post(
      `${environment.apiBaseUrl}/subscription-template-catalog/templates`,
      payload,
    ));
    await this.refreshTemplates();
  }

  async updateTemplate(id: string, payload: SaveSubscriptionTemplatePayload): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.put(
      `${environment.apiBaseUrl}/subscription-template-catalog/templates/${id}`,
      payload,
    ));
    await this.refreshTemplates();
  }

  async fetchTemplateById(id: string): Promise<SubscriptionTemplateDetailsResponse> {
    await this.authApi.ensureLoggedIn();
    return firstValueFrom(this.http.get<SubscriptionTemplateDetailsResponse>(
      `${environment.apiBaseUrl}/subscription-template-catalog/templates/${id}`,
    ));
  }
}
