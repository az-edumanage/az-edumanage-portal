import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-owner-subscription-orders-filter',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-subscription-orders-filter.component.html',
  styleUrl: './owner-subscription-orders-filter.component.css',
})
export class OwnerSubscriptionOrdersFilterComponent {
  readonly searchQuery = input('');
  readonly selectedStatus = input('');
  readonly pendingCount = input(0);

  readonly isStatusDropdownOpen = input(false);
  readonly statusDropdownSearchQuery = input('');
  readonly filteredStatuses = input<string[]>([]);

  readonly searchQueryChanged = output<string>();
  readonly statusDropdownToggled = output<void>();
  readonly statusDropdownClosed = output<void>();
  readonly statusDropdownSearchQueryChanged = output<string>();
  readonly statusSelected = output<string>();

  onSearchInput(event: Event): void {
    this.searchQueryChanged.emit((event.target as HTMLInputElement).value);
  }

  onStatusSearchInput(event: Event): void {
    this.statusDropdownSearchQueryChanged.emit(
      (event.target as HTMLInputElement).value,
    );
  }
}
