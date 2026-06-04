import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantAccessContextService } from '../../data-access/tenant-access-context.service';

type AccessStateConfig = {
  badge: string;
  title: string;
  description: string;
  icon: string;
};

@Component({
  selector: 'app-tenant-access-state',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './tenant-access-state.component.html',
  styleUrl: './tenant-access-state.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantAccessStateComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly accessContext = inject(TenantAccessContextService);

  protected readonly state = computed(() => {
    const status = this.route.snapshot.data['status'] as string | undefined;
    return this.resolveState(status);
  });

  private resolveState(status: string | undefined): AccessStateConfig {
    switch (status) {
      case 'pending':
        return {
          badge: 'Waiting activation',
          title: 'Your workspace is waiting for activation',
          description: 'Payment or review is still pending, so normal tenant operations are temporarily limited.',
          icon: 'schedule',
        };
      case 'suspended':
        return {
          badge: 'Billing required',
          title: 'Your workspace is suspended',
          description: 'Billing is overdue. Access to the normal tenant workspace is blocked until the account is restored.',
          icon: 'payments',
        };
      case 'disabled':
        return {
          badge: 'Disabled',
          title: 'Your workspace has been disabled',
          description: 'An administrator disabled this workspace. Contact your platform administrator for the next step.',
          icon: 'admin_panel_settings',
        };
      case 'blocked':
        return {
          badge: 'Blocked',
          title: 'Your workspace is blocked',
          description: 'Access is blocked for security or policy reasons. Contact support or your administrator immediately.',
          icon: 'block',
        };
      default:
        return {
          badge: 'Access restricted',
          title: 'Workspace access is restricted',
          description: 'This workspace is not currently available for normal tenant access.',
          icon: 'lock',
        };
    }
  }
}
