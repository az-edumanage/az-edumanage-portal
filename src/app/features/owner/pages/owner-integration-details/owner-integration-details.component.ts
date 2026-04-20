import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OwnerIntegrationDetailsFacade } from '../../state/owner-integration-details.facade';
import { OwnerIntegrationLog } from '../../models/owner-integration-details.models';

@Component({
  selector: 'app-owner-integration-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './owner-integration-details.component.html'})
export class OwnerIntegrationDetailsComponent implements OnInit {
  private readonly facade = inject(OwnerIntegrationDetailsFacade);

  readonly activeTab = this.facade.activeTab;
  readonly integration = this.facade.integration;
  readonly configForm = this.facade.configForm;

  get logs(): OwnerIntegrationLog[] {
    return this.facade.logs();
  }

  get showSecret(): boolean {
    return this.facade.showSecret;
  }

  set showSecret(value: boolean) {
    this.facade.showSecret = value;
  }

  get isCheckingHealth(): boolean {
    return this.facade.isCheckingHealth;
  }

  get healthStatus() {
    return this.facade.healthStatus;
  }

  get lastHealthCheckResult(): string {
    return this.facade.lastHealthCheckResult;
  }

  get healthLog(): string {
    return this.facade.healthLog;
  }

  ngOnInit(): void {
    this.facade.initialize();
  }

  toggleStatus(): void {
    this.facade.toggleStatus();
  }

  saveConfig(): void {
    this.facade.saveConfig();
  }

  runHealthCheck(): void {
    this.facade.runHealthCheck();
  }
}
