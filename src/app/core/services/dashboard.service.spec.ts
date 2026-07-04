import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let router: Pick<Router, 'navigate' | 'navigateByUrl'> & {
    navigateCalls: unknown[][];
    navigateByUrlCalls: unknown[];
  };

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(
      'dark',
      'theme-brand',
      'theme-light',
      'theme-dark',
      'theme-tenant-default',
      'theme-tenant-ocean'
    );
    document.documentElement.style.colorScheme = '';

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: () => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });

    router = {
      navigateCalls: [],
      navigateByUrlCalls: [],
      navigate: (...args: unknown[]) => {
        router.navigateCalls.push(args);
        return Promise.resolve(true);
      },
      navigateByUrl: (url: unknown) => {
        router.navigateByUrlCalls.push(url);
        return Promise.resolve(true);
      },
    };

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: router }],
    });

    service = TestBed.inject(DashboardService);
  });

  it('should toggle sidebar collapsed state', () => {
    const initial = service.sidebarCollapsed();
    service.toggleSidebar();
    expect(service.sidebarCollapsed()).toBe(!initial);
  });

  it('should toggle theme state', () => {
    const initial = service.theme();
    service.toggleTheme();
    expect(service.theme()).not.toBe(initial);
  });

  it('should apply root theme classes on init', () => {
    service.initTheme();

    expect(document.documentElement.classList.contains('theme-brand')).toBe(true);
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
    expect(document.documentElement.classList.contains('theme-tenant-default')).toBe(true);
    expect(document.documentElement.classList.contains('theme-tenant-ocean')).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('should persist theme and switch classes when toggled', () => {
    service.initTheme();

    service.toggleTheme();

    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('theme-brand')).toBe(true);
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains('theme-light')).toBe(false);
    expect(document.documentElement.classList.contains('theme-tenant-default')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('should apply tenant theme only for tenant role', () => {
    service.setTenantTheme('ocean');
    service.setRole('tenant');

    expect(document.documentElement.classList.contains('theme-tenant-ocean')).toBe(true);
    expect(localStorage.getItem('tenant-theme')).toBe('ocean');

    service.setRole('owner');
    expect(document.documentElement.classList.contains('theme-tenant-default')).toBe(true);
    expect(document.documentElement.classList.contains('theme-tenant-ocean')).toBe(false);
  });

  it('should navigate to return URL when switching to owner with pending returnUrl', () => {
    service.returnUrl.set('/owner/subscriptions/orders');

    service.setRole('owner');

    expect(router.navigateByUrlCalls).toContain('/owner/subscriptions/orders');
    expect(service.returnUrl()).toBeNull();
  });

  it('should ignore root return URL after login and open the selected workspace overview', () => {
    service.returnUrl.set('/');

    service.setRole('tenant');

    expect(router.navigateByUrlCalls).toHaveLength(0);
    expect(router.navigateCalls).toContainEqual([['/tenant/overview']]);
    expect(service.returnUrl()).toBeNull();
  });

  it('should ignore return URLs from another workspace after login', () => {
    service.returnUrl.set('/owner/overview');

    service.setRole('tenant');

    expect(router.navigateByUrlCalls).toHaveLength(0);
    expect(router.navigateCalls).toContainEqual([['/tenant/overview']]);
    expect(service.returnUrl()).toBeNull();
  });

  it('should start unresolved when router URL is not a dashboard workspace', () => {
    expect(service.currentRole()).toBeNull();
  });

  it('should resolve workspace from URL prefixes', () => {
    expect(service.resolveWorkspaceFromUrl('/owner/overview')).toBe('owner');
    expect(service.resolveWorkspaceFromUrl('/tenant/overview?x=1')).toBe('tenant');
    expect(service.resolveWorkspaceFromUrl('/teacher/overview#top')).toBe('teacher');
    expect(service.resolveWorkspaceFromUrl('/tenant/change-password')).toBe('tenant');
    expect(service.resolveWorkspaceFromUrl('/forbidden')).toBeNull();
  });

  it('should sync role from URL without navigating', () => {
    const role = service.syncRoleFromUrl('/tenant/overview');

    expect(role).toBe('tenant');
    expect(service.currentRole()).toBe('tenant');
    expect(router.navigateCalls).toHaveLength(0);
  });

  it('should allow clearing current role without navigating', () => {
    service.setRole(null);

    expect(service.currentRole()).toBeNull();
    expect(router.navigateCalls).toHaveLength(0);
  });
});
