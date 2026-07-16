import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { ModuleCategory, ModuleStatus, OwnerModule } from '../models/owner-modules.models';

export interface ModuleCatalogFeature {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  moduleCategory: string;
  price: number;
  active: boolean;
}

export interface UpdateFeaturePayload {
  nameEn: string;
  nameAr: string;
  moduleCategory: string;
  price: number;
  active: boolean;
}

export type CreateFeaturePayload = UpdateFeaturePayload;

export interface CreateModulePayload {
  nameEn: string;
  nameAr: string;
  description: string;
  category: ModuleCategory;
  status: ModuleStatus;
  plans: string[];
  featureIds: string[];
}

interface ModuleCatalogModuleResponse {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  description: string;
  category: ModuleCategory;
  status: ModuleStatus;
  plans: string[];
  features: Array<{ id: string; price: number }>;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateModulePayload {
  nameEn: string;
  nameAr: string;
  description: string;
  category: ModuleCategory;
  status: ModuleStatus;
  plans: string[];
  featureIds: string[];
}

@Injectable({ providedIn: 'root' })
export class OwnerModuleCatalogApiService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);

  async listFeatures(): Promise<ModuleCatalogFeature[]> {
    await this.authApi.ensureLoggedIn();
    return firstValueFrom(
      this.http.get<ModuleCatalogFeature[]>(`${environment.apiBaseUrl}/module-catalog/features`),
    );
  }

  async updateFeature(id: string, payload: UpdateFeaturePayload): Promise<ModuleCatalogFeature> {
    await this.authApi.ensureLoggedIn();
    return firstValueFrom(
      this.http.put<ModuleCatalogFeature>(`${environment.apiBaseUrl}/module-catalog/features/${id}`, payload),
    );
  }

  async createFeature(payload: CreateFeaturePayload): Promise<ModuleCatalogFeature> {
    await this.authApi.ensureLoggedIn();
    return firstValueFrom(
      this.http.post<ModuleCatalogFeature>(`${environment.apiBaseUrl}/module-catalog/features`, payload),
    );
  }

  async deleteFeature(id: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete(`${environment.apiBaseUrl}/module-catalog/features/${id}`));
  }

  async listModules(): Promise<OwnerModule[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(
      this.http.get<ModuleCatalogModuleResponse[]>(`${environment.apiBaseUrl}/module-catalog/modules`),
    );

    return response.map((item) => ({
      id: item.id,
      name: item.nameEn,
      nameAr: item.nameAr,
      code: item.code,
      description: item.description,
      category: item.category,
      status: item.status,
      price: item.features.reduce((sum, feature) => sum + (feature.price ?? 0), 0),
      activeTenantsCount: 0,
      lastUpdated: this.toRelativeTime(item.updatedAt),
      includedInPlans: item.plans,
      featureIds: item.features.map((feature) => feature.id),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      icon: 'extension',
    }));
  }

  async createModule(payload: CreateModulePayload): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.post(`${environment.apiBaseUrl}/module-catalog/modules`, payload));
  }

  async getModule(id: string): Promise<OwnerModule> {
    await this.authApi.ensureLoggedIn();
    const item = await firstValueFrom(
      this.http.get<ModuleCatalogModuleResponse>(`${environment.apiBaseUrl}/module-catalog/modules/${id}`),
    );

    return {
      id: item.id,
      name: item.nameEn,
      nameAr: item.nameAr,
      code: item.code,
      description: item.description,
      category: item.category,
      status: item.status,
      price: item.features.reduce((sum, feature) => sum + (feature.price ?? 0), 0),
      activeTenantsCount: 0,
      lastUpdated: this.toRelativeTime(item.updatedAt),
      includedInPlans: item.plans,
      featureIds: item.features.map((feature) => feature.id),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      icon: 'extension',
    };
  }

  async updateModule(id: string, payload: UpdateModulePayload): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.put(`${environment.apiBaseUrl}/module-catalog/modules/${id}`, payload));
  }

  async deleteModule(id: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete(`${environment.apiBaseUrl}/module-catalog/modules/${id}`));
  }

  private toRelativeTime(isoDate: string): string {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return 'Just now';
    }

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }
}
