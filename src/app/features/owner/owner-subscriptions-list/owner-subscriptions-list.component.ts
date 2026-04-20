import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { UiPagerButtonComponent } from '../../../shared/ui';
import { OwnerSubscriptionsListFacade } from '../state/owner-subscriptions-list.facade';

@Component({
  selector: 'app-owner-subscriptions-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, UiPagerButtonComponent],
  templateUrl: './owner-subscriptions-list.component.html'})
export class OwnerSubscriptionsListComponent {
  private readonly facade = inject(OwnerSubscriptionsListFacade);

  readonly pendingOrdersCount = this.facade.pendingOrdersCount;
  readonly subscriptions = this.facade.subscriptions;
}
