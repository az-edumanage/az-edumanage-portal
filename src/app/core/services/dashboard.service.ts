import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

export type UserRole = 'owner' | 'tenant' | 'teacher';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private document = inject(DOCUMENT);

  // State
  readonly currentRole = signal<UserRole>('owner');
  readonly sidebarCollapsed = signal<boolean>(false);
  readonly returnUrl = signal<string | null>(null);
  readonly theme = signal<'light' | 'dark'>(this.getInitialTheme());
  readonly criticalNotification = signal<{title: string, message: string} | null>(null);
  readonly pendingSubscriptionOrdersCount = signal<number>(3); // Mock initial value based on current mock data

  constructor() {
    this.initTheme();
  }

  private getInitialTheme(): 'light' | 'dark' {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }

  // Actions
  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  setRole(role: UserRole) {
    this.currentRole.set(role);
    
    if (role === 'owner') {
      const backUrl = this.returnUrl();
      if (backUrl) {
        this.router.navigateByUrl(backUrl);
        this.returnUrl.set(null);
      } else {
        this.router.navigate(['/owner/overview']);
      }
    } else {
      this.router.navigate([`/${role}/overview`]);
    }
  }

  toggleTheme() {
    this.theme.update(t => t === 'dark' ? 'light' : 'dark');
    this.applyTheme();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', this.theme());
    }
  }

  private applyTheme() {
    if (isPlatformBrowser(this.platformId)) {
      const root = this.document.documentElement;
      const isDark = this.theme() === 'dark';

      root.classList.add('theme-brand');
      root.classList.toggle('theme-dark', isDark);
      root.classList.toggle('theme-light', !isDark);
      root.classList.toggle('dark', isDark);
      root.style.colorScheme = isDark ? 'dark' : 'light';
    }
  }

  // Initialize theme
  initTheme() {
    this.applyTheme();
  }
}
