import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

export interface SelectPanelOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './select-panel.component.html',
  styleUrl: './select-panel.component.css',
})
export class SelectPanelComponent {
  @Input({ required: true }) label = '';
  @Input() searchPlaceholder = 'Search...';
  @Input() emptyLabel = 'No options found';
  @Input() options: SelectPanelOption[] = [];
  @Input() multi = false;
  @Input() showSearch = true;
  @Input() selectedValues: string[] = [];
  @Input() selectedValue: string | null = null;

  @Output() selectedValuesChange = new EventEmitter<string[]>();
  @Output() selectedValueChange = new EventEmitter<string | null>();

  readonly open = signal(false);
  readonly query = signal('');

  readonly selectedCount = computed(() =>
    this.multi ? this.selectedValues.length : this.selectedValue ? 1 : 0,
  );

  togglePanel(): void {
    this.open.update((v) => !v);
    if (!this.open()) {
      this.query.set('');
    }
  }

  closePanel(): void {
    this.open.set(false);
    this.query.set('');
  }

  onQueryChange(value: string): void {
    this.query.set(value ?? '');
  }

  filteredOptions(): SelectPanelOption[] {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.options;
    return this.options.filter((opt) => opt.label.toLowerCase().includes(q));
  }

  isSelected(value: string): boolean {
    return this.multi ? this.selectedValues.includes(value) : this.selectedValue === value;
  }

  onOptionClick(value: string): void {
    if (this.multi) {
      const next = new Set(this.selectedValues);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      this.selectedValuesChange.emit(Array.from(next));
      return;
    }

    const next = this.selectedValue === value ? null : value;
    this.selectedValueChange.emit(next);
    this.closePanel();
  }

  clearSelection(event?: Event): void {
    event?.stopPropagation();
    if (this.multi) {
      this.selectedValuesChange.emit([]);
      return;
    }
    this.selectedValueChange.emit(null);
  }
}
