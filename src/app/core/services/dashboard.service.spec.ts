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

  it('should navigate to return URL when switching to owner with pending returnUrl', () => {
    service.returnUrl.set('/owner/subscriptions/orders');

    service.setRole('owner');

    expect(router.navigateByUrlCalls).toContain('/owner/subscriptions/orders');
    expect(service.returnUrl()).toBeNull();
  });
});
