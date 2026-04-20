import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Tab } from '../../owner-billing/models/owner-billing.models';

@Component({
  selector: 'app-owner-billing-filter-panel',
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-billing-filter-panel.component.html',
  styleUrl: './owner-billing-filter-panel.component.css',
})
export class OwnerBillingFilterPanelComponent {
  activeTab = input.required<Tab>();
  isFiltered = input(false);
  searchQuery = input('');
  showAdvancedFilters = input(false);
  filterStatus = input('All');
  filterMinAmount = input<number | null>(null);
  filterMaxAmount = input<number | null>(null);

  activeTabChange = output<Tab>();
  resetFilters = output<void>();
  searchQueryChange = output<string>();
  showAdvancedFiltersChange = output<boolean>();
  filterStatusChange = output<string>();
  filterMinAmountChange = output<number | null>();
  filterMaxAmountChange = output<number | null>();

  setTab(tab: Tab): void {
    this.activeTabChange.emit(tab);
  }

  onSearchQueryChange(value: string): void {
    this.searchQueryChange.emit(value);
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFiltersChange.emit(!this.showAdvancedFilters());
  }

  closeAdvancedFilters(): void {
    this.showAdvancedFiltersChange.emit(false);
  }

  onFilterStatusChange(value: string): void {
    this.filterStatusChange.emit(value);
  }

  onFilterMinAmountChange(value: string | number | null): void {
    this.filterMinAmountChange.emit(this.parseNumber(value));
  }

  onFilterMaxAmountChange(value: string | number | null): void {
    this.filterMaxAmountChange.emit(this.parseNumber(value));
  }

  private parseNumber(value: string | number | null): number | null {
    if (value === null || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
}
