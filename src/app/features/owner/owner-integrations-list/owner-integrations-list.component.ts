import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { IntegrationType } from '../models/owner-integrations.models';
import { OwnerIntegrationsListFacade } from '../state/owner-integrations-list.facade';

@Component({
  selector: 'app-owner-integrations-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-integrations-list.component.html'})
export class OwnerIntegrationsListComponent {
  private readonly facade = inject(OwnerIntegrationsListFacade);

  readonly filter = this.facade.filter;
  readonly filteredIntegrations = this.facade.filteredIntegrations;

  setFilter(value: 'All' | IntegrationType): void {
    this.facade.setFilter(value);
  }
}
