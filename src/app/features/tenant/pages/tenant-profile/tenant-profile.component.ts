import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthIdentityService } from '../../../../core/auth/auth-identity.service';

@Component({
  selector: 'app-tenant-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Account</p>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Review your tenant dashboard account details.</p>
        </div>
      </header>

      <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
            {{ initials() }}
          </div>
          <div class="min-w-0">
            <h2 class="truncate text-xl font-bold text-slate-900 dark:text-white">{{ username() }}</h2>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ roleLabel() }}</p>
          </div>
        </div>

        <dl class="mt-6 grid gap-4 sm:grid-cols-2">
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <dt class="text-xs font-bold uppercase tracking-wider text-slate-500">Username</dt>
            <dd class="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{{ username() }}</dd>
          </div>
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <dt class="text-xs font-bold uppercase tracking-wider text-slate-500">Role</dt>
            <dd class="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{{ roleLabel() }}</dd>
          </div>
        </dl>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 class="text-base font-bold text-slate-900 dark:text-white">Account actions</h2>
        <div class="mt-4 flex flex-wrap gap-3">
          @if (canManageUsers()) {
            <a
              routerLink="/tenant/users"
              class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-800 dark:text-slate-300 dark:hover:border-indigo-900/60 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300"
            >
              <mat-icon class="text-base">manage_accounts</mat-icon>
              Manage users
            </a>
          }
          @if (canManageSettings()) {
            <a
              routerLink="/tenant/settings"
              class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-800 dark:text-slate-300 dark:hover:border-indigo-900/60 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300"
            >
              <mat-icon class="text-base">settings</mat-icon>
              Platform settings
            </a>
          }
        </div>
      </section>
    </div>
  `,
})
export class TenantProfileComponent {
  private readonly identity = inject(AuthIdentityService);

  readonly username = computed(() => this.identity.username() ?? 'Unknown');
  readonly initials = computed(() => this.username().trim().slice(0, 2).toUpperCase() || 'U');
  readonly roleLabel = computed(() => {
    const role = this.identity.primaryRole() ?? 'UNKNOWN';
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Superuser',
      OWNER: 'Owner',
      TENANT_ADMIN: 'Tenant Admin',
      WEB_USER: 'Tenant User',
    };
    return labels[role] ?? role.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
  });
  readonly canManageUsers = computed(() => this.identity.hasPermission('tenant.users.view'));
  readonly canManageSettings = computed(() => this.identity.hasPermission('tenant.settings.manage'));
}
