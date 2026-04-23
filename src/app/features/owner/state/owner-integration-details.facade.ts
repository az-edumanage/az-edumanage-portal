import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { OwnerIntegrationDetailsDataService } from '../data-access/owner-integration-details-data.service';
import { OwnerIntegrationConfigValue } from '../models/owner-integration-details.models';
import { OwnerIntegrationDetailsStore } from './owner-integration-details.store';

@Injectable({ providedIn: 'root' })
export class OwnerIntegrationDetailsFacade {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(OwnerIntegrationDetailsDataService);
  private readonly store = inject(OwnerIntegrationDetailsStore);

  readonly activeTab = this.store.activeTab;
  readonly integration = this.store.integration;
  readonly logs = this.store.logs;

  readonly configForm = this.fb.group({
    isLive: [true],
    apiKey: ['pk_live_51M...', Validators.required],
    secretKey: ['sk_live_51M...', Validators.required],
    webhookSecret: ['whsec_...'],
  });

  initialize(): void {
    const seed = this.data.getSeed();
    this.store.integration.set(seed.integration);
    this.store.logs.set(seed.logs);
  }

  get showSecret(): boolean {
    return this.store.showSecret();
  }

  set showSecret(value: boolean) {
    this.store.setShowSecret(value);
  }

  get isCheckingHealth(): boolean {
    return this.store.isCheckingHealth();
  }

  get healthStatus() {
    return this.store.healthStatus();
  }

  get lastHealthCheckResult(): string {
    return this.store.lastHealthCheckResult();
  }

  get healthLog(): string {
    return this.store.healthLog();
  }

  toggleStatus(): void {
    const nextStatus = this.integration().status === 'Connected' ? 'Not Configured' : 'Connected';
    this.store.integration.update((item) => ({ ...item, status: nextStatus }));
  }

  saveConfig(): void {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }

    this.data
      .saveConfig(this.configForm.getRawValue() as OwnerIntegrationConfigValue)
      .subscribe(() => {
        this.store.integration.update((item) => ({
          ...item,
          mode: this.configForm.get('isLive')?.value ? 'Live' : 'Test',
        }));
      });
  }

  runHealthCheck(): void {
    this.store.setCheckingHealth(true);
    this.store.setHealthStatus('Unknown');
    this.store.setHealthLog(
      'Initializing connection...\nAuthenticating with provider...\nSending test payload...',
    );

    this.data
      .runHealthCheck(this.integration().id)
      .pipe(finalize(() => this.store.setCheckingHealth(false)))
      .subscribe((result) => {
        this.store.setHealthStatus(result.healthStatus);
        this.store.setHealthResult(result.message);
        this.store.setHealthLog(`${this.store.healthLog()}${result.log}`);
        this.store.integration.update((item) => ({
          ...item,
          lastHealthCheck: result.lastHealthCheck,
        }));
      });
  }
}
