import { Injectable } from '@angular/core';
import { Observable, map, of, timer } from 'rxjs';
import { OwnerSummary } from '../models/owner.models';

interface OwnerTenantEditPayload {
  centerName: string;
  tenantType: string;
  subdomain: string;
  domain: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  country: string;
  planId: string;
  isTrial: boolean;
  trialDays: number;
}

interface IntegrationHealthResult {
  healthStatus: 'Healthy' | 'Unhealthy';
  message: string;
  log: string;
  lastHealthCheck: string;
}

@Injectable({ providedIn: 'root' })
export class OwnerApiService {
  getSummary(): Observable<OwnerSummary> {
    return of({
      tenants: 0,
      activeSubscriptions: 0,
      monthlyRevenue: 0,
    });
  }

  createTenant(payload: Record<string, unknown>): Observable<Record<string, unknown>> {
    return timer(2000).pipe(map(() => payload));
  }

  updateTenant(
    tenantId: string,
    payload: Record<string, unknown>,
  ): Observable<{ tenantId: string; payload: Record<string, unknown> }> {
    return timer(1500).pipe(map(() => ({ tenantId, payload })));
  }

  fetchTenantForEdit(tenantId: string): Observable<OwnerTenantEditPayload> {
    void tenantId;
    return timer(500).pipe(
      map(() => ({
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
      })),
    );
  }

  upgradeTenantPlan(
    tenantId: string,
    planId: string,
  ): Observable<{ tenantId: string; planId: string }> {
    return timer(1500).pipe(map(() => ({ tenantId, planId })));
  }

  runIntegrationHealthCheck(
    integrationId: string,
  ): Observable<{ integrationId: string; result: IntegrationHealthResult }> {
    return timer(2000).pipe(
      map(() => ({
        integrationId,
        result: {
          healthStatus: 'Healthy',
          message: 'Connection successful. Latency: 45ms.',
          log: '\nReceived 200 OK.\nVerifying webhook signature... OK.\nHealth check completed successfully.',
          lastHealthCheck: 'Just now',
        },
      })),
    );
  }
}
