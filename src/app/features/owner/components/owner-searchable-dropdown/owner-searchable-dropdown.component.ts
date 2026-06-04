import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface OwnerSearchableDropdownOption {
  value: string;
  label: string;
}

type OwnerSearchableDropdownInput = string | OwnerSearchableDropdownOption;
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
  readonly options = input<OwnerSearchableDropdownInput[]>([]);
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

  readonly normalizedOptions = computed(() =>
    this.options().map((option) =>
      typeof option === 'string' ? { value: option, label: option } : option,
    ),
  );

  readonly selectedLabel = computed(() =>
    this.normalizedOptions().find((option) => option.value === this.selectedValue())?.label ?? '',
  );

  readonly filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) {
      return this.normalizedOptions();
    }

    return this.normalizedOptions().filter((option) =>
      option.label.toLowerCase().includes(query),
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

  onSelect(option: OwnerSearchableDropdownOption): void {
    if (this.disabled()) {
      return;
    }
    this.optionSelected.emit(option.value);
  }
}
