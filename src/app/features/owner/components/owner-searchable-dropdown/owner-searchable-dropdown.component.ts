import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-owner-searchable-dropdown',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-searchable-dropdown.component.html',
  styleUrl: './owner-searchable-dropdown.component.css',
})
export class OwnerSearchableDropdownComponent {
  readonly label = input.required<string>();
  readonly placeholder = input.required<string>();
  readonly searchPlaceholder = input('Search...');
  readonly options = input<string[]>([]);
  readonly selectedValue = input('');
  readonly searchQuery = input('');
  readonly isOpen = input(false);
  readonly emptyStateText = input('No options found');
  readonly dropdownId = input('owner-dropdown-listbox');
  readonly panelPosition = input<'bottom' | 'top'>('bottom');
  readonly disabled = input(false);

  readonly toggled = output<void>();
  readonly closed = output<void>();
  readonly searchQueryChange = output<string>();
  readonly optionSelected = output<string>();

  readonly filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) {
      return this.options();
    }

    return this.options().filter((option) =>
      option.toLowerCase().includes(query),
    );
  });

  onToggle(): void {
    if (this.disabled()) {
      return;
    }
    this.toggled.emit();
  }

  onClose(): void {
    this.closed.emit();
  }

  onSearchInput(event: Event): void {
    if (this.disabled()) {
      return;
    }
    const value = (event.target as HTMLInputElement).value;
    this.searchQueryChange.emit(value);
  }

  onSelect(option: string): void {
    if (this.disabled()) {
      return;
    }
    this.optionSelected.emit(option);
  }
}
