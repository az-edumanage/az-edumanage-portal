import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ProvisioningJob } from '../models/owner-provisioning.models';

interface OwnerProvisioningResponse {
  tenantId: string;
  tenantName: string;
  planName: string;
  triggeredBy: string | null;
  source: string | null;
  schemaName: string;
  provisioningStatus: string;
  provisioningError: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class OwnerProvisioningDataService {
  readonly jobs = signal<ProvisioningJob[]>([]);

  constructor(private readonly http: HttpClient) {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    const rows = await firstValueFrom(
      this.http.get<OwnerProvisioningResponse[]>(`${environment.apiBaseUrl}/owner/provisioning`),
    );
    this.jobs.set(rows.map((row) => this.mapRow(row)));
  }

  addProvisioningJob(_: {
    tenantName: string;
    plan: string;
    triggeredBy?: 'System' | 'Admin';
    status?: ProvisioningJob['status'];
  }): ProvisioningJob {
    const fallback: ProvisioningJob = {
      id: `local-${Date.now()}`,
      tenantId: `local-${Date.now()}`,
      tenantName: _.tenantName,
      plan: _.plan,
      triggeredBy: _.triggeredBy ?? 'System',
      createdDate: new Date().toLocaleString('en-US'),
      status: _.status ?? 'In Progress',
      source: 'local',
      schemaName: '-',
      isActive: false,
      error: null,
    };
    this.jobs.update((current) => [fallback, ...current]);
    return fallback;
  }

  private mapRow(row: OwnerProvisioningResponse): ProvisioningJob {
    return {
      id: row.tenantId,
      tenantId: row.tenantId,
      tenantName: row.tenantName,
      plan: row.planName,
      triggeredBy: (row.triggeredBy ?? 'system').toLowerCase() === 'admin' ? 'Admin' : 'System',
      createdDate: this.formatDate(row.createdAt),
      status: this.mapStatus(row.provisioningStatus),
      source: row.source ?? 'unknown',
      schemaName: row.schemaName,
      isActive: row.isActive,
      error: row.provisioningError,
    };
  }

  private mapStatus(status: string | null): string {
    switch ((status ?? 'PENDING').toUpperCase()) {
      case 'PROVISIONED':
        return 'Completed';
      case 'FAILED':
        return 'Failed';
      default:
        return 'In Progress';
    }
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
