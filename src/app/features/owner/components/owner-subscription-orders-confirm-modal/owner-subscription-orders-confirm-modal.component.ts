import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  SubscriptionOrder,
  SubscriptionOrderActionType,
} from '../../models/owner-subscription-orders.models';

@Component({
  selector: 'app-owner-subscription-orders-confirm-modal',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-subscription-orders-confirm-modal.component.html',
  styleUrl: './owner-subscription-orders-confirm-modal.component.css',
})
export class OwnerSubscriptionOrdersConfirmModalComponent {
  readonly isOpen = input(false);
  readonly order = input<SubscriptionOrder | null>(null);
  readonly actionType = input<SubscriptionOrderActionType>('approve');

  readonly closed = output<void>();
  readonly confirmed = output<void>();
}
