import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-owner-domain-dropdown',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-domain-dropdown.component.html',
  styleUrl: './owner-domain-dropdown.component.css',
})
export class OwnerDomainDropdownComponent {
  readonly domains = input<string[]>([]);
  readonly selectedDomain = input('');
  readonly isOpen = input(false);

  readonly toggled = output<void>();
  readonly closed = output<void>();
  readonly domainSelected = output<string>();

  onToggle(): void {
    this.toggled.emit();
  }

  onClose(): void {
    this.closed.emit();
  }

  onSelect(domain: string): void {
    this.domainSelected.emit(domain);
  }
}
