import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantGroupSelectorOption } from '../../models/tenant-group-create.models';

@Component({
  selector: 'app-tenant-group-searchable-selector',
  host: { '(click)': '$event.stopPropagation()' },
  imports: [CommonModule, RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-group-searchable-selector.component.html',
  styleUrl: './tenant-group-searchable-selector.component.css',
})
export class TenantGroupSearchableSelectorComponent {
  readonly triggerId = input.required<string>();
  readonly label = input.required<string>();
  readonly placeholder = input.required<string>();
  readonly selectedValue = input('');
  readonly isOpen = input(false);
  readonly disabled = input(false);
  readonly hideLabel = input(false);

  readonly options = input<TenantGroupSelectorOption[]>([]);
  readonly searchQuery = input('');
  readonly searchPlaceholder = input('Search...');
  readonly emptyText = input('No items found');

  readonly footerRouterLink = input<string | null>(null);
  readonly footerQueryParams = input<Record<string, string> | null>(null);
  readonly footerIcon = input('add');
  readonly footerLabel = input<string | null>(null);
  readonly footerButton = input<string | null>(null);

  readonly toggled = output<void>();
  readonly searchQueryChanged = output<string>();
  readonly selected = output<string>();
  readonly footerClicked = output<void>();

  onToggle(): void {
    if (this.disabled()) {
      return;
    }

    this.toggled.emit();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQueryChanged.emit(value);
  }

  onSelect(name: string): void {
    this.selected.emit(name);
  }

  onFooterClick(): void {
    this.footerClicked.emit();
  }
}
