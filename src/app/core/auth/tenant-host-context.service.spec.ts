import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { TenantHostContextService } from './tenant-host-context.service';

describe('TenantHostContextService', () => {
  function configure(hostname: string): TenantHostContextService {
    TestBed.configureTestingModule({
      providers: [
        TenantHostContextService,
        {
          provide: DOCUMENT,
          useValue: {
            location: { hostname },
          },
        },
      ],
    });
    return TestBed.inject(TenantHostContextService);
  }

  it('detects tenant subdomains from the browser hostname', () => {
    const service = configure('hussein.az-edumanage.com');

    expect(service.context()).toEqual({
      contextType: 'tenant',
      hostname: 'hussein.az-edumanage.com',
      subdomain: 'hussein',
    });
    expect(service.isTenantHost()).toBe(true);
  });

  it('treats the dedicated tenant host as the tenant login entry', () => {
    const service = configure('tenant.az-edumanage.com');

    expect(service.context()).toEqual({
      contextType: 'tenant',
      hostname: 'tenant.az-edumanage.com',
      subdomain: 'tenant',
    });
    expect(service.isTenantHost()).toBe(true);
  });

  it('extracts tenant aliases below tenant.az-edumanage.com', () => {
    const service = configure('school.tenant.az-edumanage.com');

    expect(service.context()).toEqual({
      contextType: 'tenant',
      hostname: 'school.tenant.az-edumanage.com',
      subdomain: 'school',
    });
    expect(service.isTenantHost()).toBe(true);
  });

  it('keeps panel.az-edumanage.com on the owner platform flow', () => {
    const service = configure('panel.az-edumanage.com');

    expect(service.context()).toEqual({
      contextType: 'platform',
      hostname: 'panel.az-edumanage.com',
      subdomain: null,
    });
    expect(service.isTenantHost()).toBe(false);
  });

  it('marks reserved subdomains separately from tenant hosts', () => {
    const service = configure('api.az-edumanage.com');

    expect(service.context().contextType).toBe('reserved');
    expect(service.isTenantHost()).toBe(false);
  });
});
