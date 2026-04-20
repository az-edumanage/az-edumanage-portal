import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TenantPlanOption } from '../../models/owner-tenant-create.models';

@Component({
  selector: 'app-owner-plan-dropdown',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-plan-dropdown.component.html',
  styleUrl: './owner-plan-dropdown.component.css',
})
export class OwnerPlanDropdownComponent {
  readonly plans = input<TenantPlanOption[]>([]);
  readonly selectedPlanId = input('');
  readonly selectedPlanName = input('');
  readonly isOpen = input(false);
  readonly searchQuery = input('');

  readonly toggled = output<void>();
  readonly closed = output<void>();
  readonly searchQueryChange = output<string>();
  readonly planSelected = output<string>();

  readonly filteredPlans = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) {
      return this.plans();
    }

    return this.plans().filter((plan) =>
      plan.name.toLowerCase().includes(query),
    );
  });

  onToggle(): void {
    this.toggled.emit();
  }

  onClose(): void {
    this.closed.emit();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQueryChange.emit(value);
  }

  onSelect(planId: string): void {
    this.planSelected.emit(planId);
  }
}
