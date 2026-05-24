import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { OwnerTenantsListStore } from './owner-tenants-list.store';
import { OwnerTenantsDataService } from '../data-access/owner-tenants-data.service';
import { Tenant } from '../models/owner-tenants.models';

describe('OwnerTenantsListStore', () => {
  let store: OwnerTenantsListStore;
  let dataService: {
    tenants: WritableSignal<Tenant[]>;
    updateTenantPlan: (...args: unknown[]) => void;
  };

  beforeEach(() => {
    localStorage.setItem('beedu.auth.token', 'test-token');
    dataService = {
      tenants: signal<Tenant[]>([
        {
          id: 'tenant-1',
          name: 'Bright Center',
          fullName: 'Owner Name',
          phoneNumber: '01000000000',
          status: 'Pending',
          ownerDisplayStatus: 'pending',
          providerPaymentStatus: 'pending',
          tenantOperationalStatus: 'active',
          settlementStatus: 'unpaid',
          plan: 'Professional',
          createdDate: 'May 24, 2026',
          ownerEmail: 'owner@example.com',
          healthStatus: 'Healthy',
          tenantType: 'center',
          subscriptionType: 'production',
          createdBy: 'system',
        },
      ]),
      updateTenantPlan: () => {},
    };
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), { provide: OwnerTenantsDataService, useValue: dataService }],
    });
    store = TestBed.inject(OwnerTenantsListStore);
  });

  afterEach(() => {
    localStorage.removeItem('beedu.auth.token');
  });

  it('exposes searchQuery and filteredTenants signals', () => {
    expect(store.searchQuery).toBeDefined();
    expect(typeof store.searchQuery).toBe('function');
    expect(store.filteredTenants).toBeDefined();
    expect(typeof store.filteredTenants).toBe('function');
  });

  it('updates pendingStatusChange when requestStatusChange is called', () => {
    store.searchQuery.set('bright');
    const tenants = store.filteredTenants();
    if (tenants.length === 0) return;

    const target = tenants[0];
    store.requestStatusChange(target, 'Suspended');
    expect(store.pendingStatusChange()).not.toBeNull();
    expect(store.pendingStatusChange()?.tenant.id).toBe(target.id);
    expect(store.pendingStatusChange()?.status).toBe('Suspended');
  });

  it('clears pendingStatusChange after confirm', () => {
    store.searchQuery.set('bright');
    const tenants = store.filteredTenants();
    if (tenants.length === 0) return;

    const target = tenants[0];
    store.requestStatusChange(target, 'Suspended');
    store.confirmStatusChange();
    expect(store.pendingStatusChange()).toBeNull();
  });

  it('does not mutate backend-derived status fields when confirming a pending status change', () => {
    const target = store.filteredTenants()[0];

    store.requestStatusChange(target, 'Suspended');
    store.confirmStatusChange();

    const after = store.filteredTenants()[0];
    expect(after.status).toBe('Pending');
    expect(after.ownerDisplayStatus).toBe('pending');
    expect(after.providerPaymentStatus).toBe('pending');
    expect(after.tenantOperationalStatus).toBe('active');
    expect(after.settlementStatus).toBe('unpaid');
  });
});
