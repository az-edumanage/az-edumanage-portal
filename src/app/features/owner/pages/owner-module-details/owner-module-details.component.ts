import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { OwnerModuleDetailsFacade } from '../../state/owner-module-details.facade';

@Component({
  selector: 'app-owner-module-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './owner-module-details.component.html'})
export class OwnerModuleDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(OwnerModuleDetailsFacade);

  readonly activeTab = this.facade.activeTab;
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;
  readonly module = this.facade.module;
  readonly features = this.facade.features;
  readonly limits = this.facade.limits;
  readonly availablePlans = this.facade.availablePlans;
  readonly overrides = this.facade.overrides;
  readonly changeLogs = this.facade.changeLogs;

  constructor() {
    this.route.params.subscribe((params) => {
      void this.facade.loadModuleData(params['id']);
    });
  }

  toggleStatus(): void {
    this.facade.toggleStatus();
  }
}
