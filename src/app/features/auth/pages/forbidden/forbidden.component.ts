import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-6">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm text-center space-y-4">
        <div class="mx-auto h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 flex items-center justify-center text-xl font-bold">
          403
        </div>
        <div class="space-y-2">
          <h1 class="text-xl font-semibold text-slate-900 dark:text-white">Unauthorized</h1>
          <p class="text-sm text-slate-600 dark:text-slate-400">
            You do not have access to this workspace without an active tenant impersonation session.
          </p>
        </div>
        <a
          routerLink="/owner/tenants"
          class="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Return to owner tenants
        </a>
      </div>
    </div>
  `,
})
export class ForbiddenComponent {}
