import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { tenantAccessStateGuard, tenantOperationalAccessGuard } from './tenant-operational-access.guard';
import { AuthIdentityService } from '../auth/auth-identity.service';
import { TenantImpersonationService } from '../auth/tenant-impersonation.service';
import { TenantAccessContextService } from '../../features/tenant/data-access/tenant-access-context.service';
import { TenantAccessContextView } from '../../features/tenant/models/tenant-access.models';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('tenantOperationalAccessGuard', () => {
  let router: Router;
  let accessContextService: {
    context: ReturnType<typeof signal<TenantAccessContextView | null>>;
    ensureContext: ReturnType<typeof vi.fn>;
  };
  let authIdentityService: {
    currentWorkspace: ReturnType<typeof vi.fn>;
  };
  let tenantImpersonationService: {
    isActive: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    accessContextService = {
      context: signal<TenantAccessContextView | null>(null),
      ensureContext: vi.fn(),
    };
    authIdentityService = {
      currentWorkspace: vi.fn().mockReturnValue('tenant'),
    };
    tenantImpersonationService = {
      isActive: vi.fn().mockReturnValue(false),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'tenant/overview', component: DummyComponent },
          { path: 'tenant/access/pending', component: DummyComponent },
          { path: 'tenant/access/suspended', component: DummyComponent },
          { path: 'tenant/access/disabled', component: DummyComponent },
          { path: 'tenant/access/blocked', component: DummyComponent },
          { path: 'tenant/login', component: DummyComponent },
          { path: 'forbidden', component: DummyComponent },
        ]),
        { provide: TenantAccessContextService, useValue: accessContextService },
        { provide: AuthIdentityService, useValue: authIdentityService },
        { provide: TenantImpersonationService, useValue: tenantImpersonationService },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('allows active tenants to reach normal routes', async () => {
    accessContextService.ensureContext.mockResolvedValue({
      tenantId: 'tenant-1',
      subscriptionState: 'production',
      tenantOperationalStatus: 'active',
      ownerDisplayStatus: 'active',
      accessMessage: null,
      operationalStatusReason: null,
    });

    const result = await TestBed.runInInjectionContext(() => tenantOperationalAccessGuard({} as never, {
      url: '/tenant/overview',
    } as never));

    expect(result).toBe(true);
  });

  it('routes pending tenants to the pending access screen', async () => {
    accessContextService.ensureContext.mockResolvedValue({
      tenantId: 'tenant-1',
      subscriptionState: 'pending_payment',
      tenantOperationalStatus: 'pending',
      ownerDisplayStatus: 'pending',
      accessMessage: 'Waiting for payment',
      operationalStatusReason: null,
    });

    const result = await TestBed.runInInjectionContext(() => tenantOperationalAccessGuard({} as never, {
      url: '/tenant/students',
    } as never));

    expect(router.serializeUrl(result as never)).toBe('/tenant/access/pending?returnUrl=%2Ftenant%2Fstudents');
  });

  it('routes suspended tenants to the suspended billing screen', async () => {
    accessContextService.ensureContext.mockResolvedValue({
      tenantId: 'tenant-1',
      subscriptionState: 'expired',
      tenantOperationalStatus: 'suspended',
      ownerDisplayStatus: 'suspended',
      accessMessage: 'Billing overdue',
      operationalStatusReason: null,
    });

    const result = await TestBed.runInInjectionContext(() => tenantOperationalAccessGuard({} as never, {
      url: '/tenant/grades',
    } as never));

    expect(router.serializeUrl(result as never)).toBe('/tenant/access/suspended?returnUrl=%2Ftenant%2Fgrades');
  });

  it('routes disabled tenants to the disabled screen', async () => {
    accessContextService.ensureContext.mockResolvedValue({
      tenantId: 'tenant-1',
      subscriptionState: 'production',
      tenantOperationalStatus: 'disabled',
      ownerDisplayStatus: 'disabled',
      accessMessage: 'Disabled',
      operationalStatusReason: null,
    });

    const result = await TestBed.runInInjectionContext(() => tenantOperationalAccessGuard({} as never, {
      url: '/tenant/users',
    } as never));

    expect(router.serializeUrl(result as never)).toBe('/tenant/access/disabled?returnUrl=%2Ftenant%2Fusers');
  });

  it('routes blocked tenants to the blocked screen', async () => {
    accessContextService.ensureContext.mockResolvedValue({
      tenantId: 'tenant-1',
      subscriptionState: 'production',
      tenantOperationalStatus: 'blocked',
      ownerDisplayStatus: 'blocked',
      accessMessage: 'Blocked',
      operationalStatusReason: null,
    });

    const result = await TestBed.runInInjectionContext(() => tenantOperationalAccessGuard({} as never, {
      url: '/tenant/settings',
    } as never));

    expect(router.serializeUrl(result as never)).toBe('/tenant/access/blocked?returnUrl=%2Ftenant%2Fsettings');
  });

  it('uses backend context refresh rather than any stale local signal', async () => {
    accessContextService.context.set({
      tenantId: 'tenant-1',
      subscriptionState: 'production',
      tenantOperationalStatus: 'active',
      ownerDisplayStatus: 'active',
      accessMessage: null,
      operationalStatusReason: null,
    });
    accessContextService.ensureContext.mockResolvedValue({
      tenantId: 'tenant-1',
      subscriptionState: 'production',
      tenantOperationalStatus: 'blocked',
      ownerDisplayStatus: 'blocked',
      accessMessage: 'Blocked',
      operationalStatusReason: null,
    });

    const result = await TestBed.runInInjectionContext(() => tenantOperationalAccessGuard({} as never, {
      url: '/tenant/overview',
    } as never));

    expect(router.serializeUrl(result as never)).toBe('/tenant/access/blocked?returnUrl=%2Ftenant%2Foverview');
    expect(accessContextService.ensureContext).toHaveBeenCalledWith(true);
  });

  it('sends owner sessions without impersonation to forbidden instead of tenant login', async () => {
    accessContextService.ensureContext.mockResolvedValue(null);
    authIdentityService.currentWorkspace.mockReturnValue('owner');

    const result = await TestBed.runInInjectionContext(() => tenantOperationalAccessGuard({} as never, {
      url: '/tenant/overview',
    } as never));

    expect(router.serializeUrl(result as never)).toBe('/forbidden');
  });
});

describe('tenantAccessStateGuard', () => {
  let router: Router;
  let accessContextService: {
    context: ReturnType<typeof signal<TenantAccessContextView | null>>;
    ensureContext: ReturnType<typeof vi.fn>;
  };
  let authIdentityService: {
    currentWorkspace: ReturnType<typeof vi.fn>;
  };
  let tenantImpersonationService: {
    isActive: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    accessContextService = {
      context: signal<TenantAccessContextView | null>(null),
      ensureContext: vi.fn(),
    };
    authIdentityService = {
      currentWorkspace: vi.fn().mockReturnValue('tenant'),
    };
    tenantImpersonationService = {
      isActive: vi.fn().mockReturnValue(false),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'tenant/overview', component: DummyComponent },
          { path: 'tenant/access/pending', component: DummyComponent },
          { path: 'tenant/access/suspended', component: DummyComponent },
          { path: 'tenant/access/disabled', component: DummyComponent },
          { path: 'tenant/access/blocked', component: DummyComponent },
          { path: 'tenant/login', component: DummyComponent },
          { path: 'forbidden', component: DummyComponent },
        ]),
        { provide: TenantAccessContextService, useValue: accessContextService },
        { provide: AuthIdentityService, useValue: authIdentityService },
        { provide: TenantImpersonationService, useValue: tenantImpersonationService },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('keeps the matching access-state page available for pending tenants', async () => {
    accessContextService.ensureContext.mockResolvedValue({
      tenantId: 'tenant-1',
      subscriptionState: 'pending_payment',
      tenantOperationalStatus: 'pending',
      ownerDisplayStatus: 'pending',
      accessMessage: 'Waiting',
      operationalStatusReason: null,
    });

    const result = await TestBed.runInInjectionContext(() => tenantAccessStateGuard({
      data: { status: 'pending' },
    } as never, {} as never));

    expect(result).toBe(true);
  });

  it('redirects active tenants away from access-state pages', async () => {
    accessContextService.ensureContext.mockResolvedValue({
      tenantId: 'tenant-1',
      subscriptionState: 'production',
      tenantOperationalStatus: 'active',
      ownerDisplayStatus: 'active',
      accessMessage: null,
      operationalStatusReason: null,
    });

    const result = await TestBed.runInInjectionContext(() => tenantAccessStateGuard({
      data: { status: 'pending' },
    } as never, {} as never));

    expect(router.serializeUrl(result as never)).toBe('/tenant/overview');
  });

  it('returns forbidden when an owner refreshes an access-state route without impersonation context', async () => {
    accessContextService.ensureContext.mockResolvedValue(null);
    authIdentityService.currentWorkspace.mockReturnValue('owner');

    const result = await TestBed.runInInjectionContext(() => tenantAccessStateGuard({
      data: { status: 'pending' },
    } as never, {} as never));

    expect(router.serializeUrl(result as never)).toBe('/forbidden');
  });
});
