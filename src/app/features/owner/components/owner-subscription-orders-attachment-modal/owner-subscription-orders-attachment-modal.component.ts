import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-owner-subscription-orders-attachment-modal',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-subscription-orders-attachment-modal.component.html',
  styleUrl: './owner-subscription-orders-attachment-modal.component.css',
})
export class OwnerSubscriptionOrdersAttachmentModalComponent {
  readonly isOpen = input(false);
  readonly attachmentUrl = input('');
  readonly closed = output<void>();
}
