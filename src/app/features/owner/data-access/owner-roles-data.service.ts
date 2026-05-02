import { Injectable, computed, signal } from '@angular/core';
import { OwnerRole, OwnerRoleUpsertPayload } from '../models/owner-role.models';

@Injectable({ providedIn: 'root' })
export class OwnerRolesDataService {
  private readonly rolesState = signal<OwnerRole[]>([
    {
      id: 'role_super_admin',
      name: 'Super Admin',
      description: 'Full platform access across all owner operations.',
      permissions: [
        'tenant.read', 'tenant.create', 'tenant.update', 'tenant.suspend',
        'billing.invoice.read', 'billing.payment.read', 'billing.refund.create', 'billing.report.export',
        'plan.read', 'plan.write', 'subscription.read', 'subscription.write',
        'user.read', 'user.write', 'security.read', 'audit.read',
      ],
      usersCount: 2,
      isSystem: true,
      updatedAt: '2026-04-20',
    },
    {
      id: 'role_support_agent',
      name: 'Support Agent',
      description: 'Tenant troubleshooting and limited administrative access.',
      permissions: ['tenant.read', 'tenant.update', 'subscription.read', 'user.read', 'audit.read'],
      usersCount: 4,
      isSystem: true,
      updatedAt: '2026-04-18',
    },
    {
      id: 'role_billing_manager',
      name: 'Billing Manager',
      description: 'Billing visibility and payment operations.',
      permissions: ['billing.invoice.read', 'billing.payment.read', 'billing.refund.create', 'billing.report.export', 'subscription.read'],
      usersCount: 3,
      isSystem: true,
      updatedAt: '2026-04-16',
    },
  ]);

  readonly roles = computed(() => this.rolesState());

  getById(id: string | null): OwnerRole | null {
    if (!id) {
      return null;
    }

    return this.rolesState().find((role) => role.id === id) ?? null;
  }

  upsert(payload: OwnerRoleUpsertPayload): OwnerRole {
    if (payload.id) {
      const existing = this.getById(payload.id);
      if (existing) {
        const updated: OwnerRole = {
          ...existing,
          name: payload.name,
          description: payload.description,
          permissions: payload.permissions,
          updatedAt: new Date().toISOString().slice(0, 10),
        };

        this.rolesState.update((roles) => roles.map((role) => (role.id === payload.id ? updated : role)));
        return updated;
      }
    }

    const created: OwnerRole = {
      id: `role_${crypto.randomUUID().slice(0, 8)}`,
      name: payload.name,
      description: payload.description,
      permissions: payload.permissions,
      usersCount: 0,
      isSystem: false,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    this.rolesState.update((roles) => [created, ...roles]);
    return created;
  }

  deleteRole(id: string): void {
    this.rolesState.update((roles) => roles.filter((role) => role.id !== id));
  }
}
