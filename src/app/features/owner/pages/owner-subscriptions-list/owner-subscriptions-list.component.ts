import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { UiPagerButtonComponent } from '../../../../shared/ui';
import { OwnerSubscriptionsListFacade } from '../../state/owner-subscriptions-list.facade';
import { OwnerSubscriptionStatusesDataService } from '../../data-access/owner-subscription-statuses-data.service';

@Component({
  selector: 'app-owner-subscriptions-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, UiPagerButtonComponent],
  templateUrl: './owner-subscriptions-list.component.html',
  styleUrl: './owner-subscriptions-list.component.css'
})
export class OwnerSubscriptionsListComponent {
  private readonly facade = inject(OwnerSubscriptionsListFacade);
  private readonly subscriptionStatuses = inject(OwnerSubscriptionStatusesDataService);

  readonly pendingOrdersCount = this.facade.pendingOrdersCount;
  readonly subscriptions = this.facade.subscriptions;
  readonly statusOptions = this.subscriptionStatuses.statusNames;

  getStatusColor(status: string): string {
    return this.subscriptionStatuses.findByName(status)?.color ?? '#64748b';
  }
}
