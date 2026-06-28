import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DashboardAction, DashboardActionsRegistry } from './dashboard-actions.registry';

@Component({
  selector: 'app-dashboard-action-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './dashboard-action-picker.component.html',
  styleUrl: './dashboard-action-picker.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardActionPickerComponent {
  private readonly registry = inject(DashboardActionsRegistry);
  private readonly router = inject(Router);

  @Input({ required: true }) open = false;
  @Output() closed = new EventEmitter<void>();

  readonly query = signal('');
  readonly actions = computed(() => this.registry.availableActions(this.query()));

  close(): void {
    this.query.set('');
    this.closed.emit();
  }

  selectAction(action: DashboardAction): void {
    this.query.set('');
    this.closed.emit();
    void this.router.navigateByUrl(action.route);
  }

  onBackdropKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.close();
    }
  }
}
