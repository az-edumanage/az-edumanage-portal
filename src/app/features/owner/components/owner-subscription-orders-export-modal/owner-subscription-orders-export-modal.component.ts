import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  SubscriptionOrderExportFormat,
  SubscriptionOrderExportMode,
  SubscriptionOrderExportPdfType,
} from '../../models/owner-subscription-orders.models';

@Component({
  selector: 'app-owner-subscription-orders-export-modal',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-subscription-orders-export-modal.component.html',
  styleUrl: './owner-subscription-orders-export-modal.component.css',
})
export class OwnerSubscriptionOrdersExportModalComponent {
  readonly isOpen = input(false);
  readonly exportStep = input(1);
  readonly exportFormat = input<SubscriptionOrderExportFormat | null>(null);
  readonly exportPdfType = input<SubscriptionOrderExportPdfType>('rows');
  readonly exportDateFrom = input('');
  readonly exportDateTo = input('');
  readonly exportMode = input<SubscriptionOrderExportMode>('all');

  readonly totalOrders = input(0);
  readonly filteredOrdersCount = input(0);
  readonly selectedOrdersCount = input(0);

  readonly closed = output<void>();
  readonly exportFormatSelected = output<SubscriptionOrderExportFormat>();
  readonly exportPdfTypeSelected = output<SubscriptionOrderExportPdfType>();
  readonly exportDateFromChanged = output<string>();
  readonly exportDateToChanged = output<string>();
  readonly exportModeChanged = output<SubscriptionOrderExportMode>();
  readonly exportStepChanged = output<number>();
  readonly nextClicked = output<void>();

  onDateFromInput(event: Event): void {
    this.exportDateFromChanged.emit((event.target as HTMLInputElement).value);
  }

  onDateToInput(event: Event): void {
    this.exportDateToChanged.emit((event.target as HTMLInputElement).value);
  }

  onModeChange(event: Event): void {
    this.exportModeChanged.emit(
      (event.target as HTMLInputElement).value as SubscriptionOrderExportMode,
    );
  }
}
