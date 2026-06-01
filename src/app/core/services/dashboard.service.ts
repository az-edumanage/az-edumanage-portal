import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { safeRedirect } from '../auth/auth-url.utils';

export type UserRole = 'owner' | 'tenant' | 'teacher';
export type WorkspaceRole = UserRole | null;
export type TenantTheme = 'default' | 'ocean';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private document = inject(DOCUMENT);

  readonly currentRole = signal<WorkspaceRole>(this.resolveWorkspaceFromUrl(this.router.url));
  readonly sidebarCollapsed = signal<boolean>(false);
  readonly returnUrl = signal<string | null>(null);
  readonly theme = signal<'light' | 'dark'>(this.getInitialTheme());
  readonly tenantTheme = signal<TenantTheme>(this.getInitialTenantTheme());
  readonly criticalNotification = signal<{title: string, message: string} | null>(null);
  readonly pendingSubscriptionOrdersCount = signal<number>(3); // Mock initial value based on current mock data

  resolveWorkspaceFromUrl(url: string | null | undefined): WorkspaceRole {
    const path = (url ?? '').split('?')[0]?.split('#')[0] ?? '';
    const firstSegment = path.split('/').filter(Boolean)[0];
    if (firstSegment === 'owner' || firstSegment === 'tenant' || firstSegment === 'teacher') {
      return firstSegment;
    }
    return null;
  }

  syncRoleFromUrl(url: string | null | undefined = this.router.url): WorkspaceRole {
    const role = this.resolveWorkspaceFromUrl(url);
    this.currentRole.set(role);
    if (role === 'tenant') {
      this.syncTenantThemeFromStorage();
    }
    this.applyTheme();
    return role;
  }

  private getInitialTheme(): 'light' | 'dark' {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }

  private getInitialTenantTheme(): TenantTheme {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('tenant-theme');
      if (saved === 'default' || saved === 'ocean') return saved;
    }
    return 'default';
  }

  private syncTenantThemeFromStorage() {
    if (!isPlatformBrowser(this.platformId)) return;

    const saved = localStorage.getItem('tenant-theme');
    if (saved === 'default' || saved === 'ocean') {
      this.tenantTheme.set(saved);
    } else {
      this.tenantTheme.set('default');
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  setRole(role: WorkspaceRole, navigate = true): Promise<boolean> | void {
    this.currentRole.set(role);
    if (role === 'tenant') {
      this.syncTenantThemeFromStorage();
    }
    this.applyTheme();

    if (!navigate || role === null) {
      return;
    }

    const backUrl = safeRedirect(this.returnUrl());
    if (backUrl) {
      const navigation = this.router.navigateByUrl(backUrl);
      this.returnUrl.set(null);
      return navigation;
    }

    return this.router.navigate([`/${role}/overview`]);
  }

  toggleTheme() {
    this.theme.update(t => t === 'dark' ? 'light' : 'dark');
    this.applyTheme();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', this.theme());
    }
  }

  setTenantTheme(theme: TenantTheme) {
    this.tenantTheme.set(theme);
    this.applyTheme();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('tenant-theme', this.tenantTheme());
    }
  }

  private applyTheme() {
    if (isPlatformBrowser(this.platformId)) {
      const root = this.document.documentElement;
      const isDark = this.theme() === 'dark';
      const tenantThemeClass =
        this.currentRole() === 'tenant'
          ? `theme-tenant-${this.tenantTheme()}`
          : 'theme-tenant-default';

      root.classList.add('theme-brand');
      root.classList.toggle('theme-dark', isDark);
      root.classList.toggle('theme-light', !isDark);
      root.classList.toggle('dark', isDark);
      root.classList.remove('theme-tenant-default', 'theme-tenant-ocean');
      root.classList.add(tenantThemeClass);
      root.style.colorScheme = isDark ? 'dark' : 'light';
    }
  }

  initTheme() {
    this.applyTheme();
  }
}
