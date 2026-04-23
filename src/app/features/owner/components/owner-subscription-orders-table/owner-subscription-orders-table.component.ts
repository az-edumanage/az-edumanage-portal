import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SubscriptionOrder } from '../../models/owner-subscription-orders.models';

@Component({
  selector: 'app-owner-subscription-orders-table',
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-subscription-orders-table.component.html',
  styleUrl: './owner-subscription-orders-table.component.css',
})
export class OwnerSubscriptionOrdersTableComponent {
  readonly orders = input<SubscriptionOrder[]>([]);
  readonly selectedOrderIds = input<Set<string>>(new Set<string>());
  readonly isAllSelected = input(false);

  readonly toggleAllSelection = output<void>();
  readonly orderSelectionToggled = output<string>();
  readonly clearSelectionClicked = output<void>();
  readonly attachmentViewed = output<string>();
  readonly approveClicked = output<SubscriptionOrder>();
  readonly rejectClicked = output<SubscriptionOrder>();

  isSelected(id: string): boolean {
    return this.selectedOrderIds().has(id);
  }

  onAttachment(url: string, event: Event): void {
    event.stopPropagation();
    this.attachmentViewed.emit(url);
  }

  onApprove(order: SubscriptionOrder, event: Event): void {
    event.stopPropagation();
    this.approveClicked.emit(order);
  }

  onReject(order: SubscriptionOrder, event: Event): void {
    event.stopPropagation();
    this.rejectClicked.emit(order);
  }

  onToggleRow(id: string, event: Event): void {
    event.stopPropagation();
    this.orderSelectionToggled.emit(id);
  }
}
