import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-tenant-group-owned-by-selector',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-group-owned-by-selector.component.html',
  styleUrl: './tenant-group-owned-by-selector.component.css',
})
export class TenantGroupOwnedBySelectorComponent {
  readonly selectedValue = input('');
  readonly isOpen = input(false);

  readonly toggled = output<void>();
  readonly selected = output<string>();

  onSelect(value: string): void {
    this.selected.emit(value);
  }
}
