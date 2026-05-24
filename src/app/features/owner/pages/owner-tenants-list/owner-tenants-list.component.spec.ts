import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OwnerTenantsListComponent } from './owner-tenants-list.component';
import { OwnerTenantsListFacade } from '../../state/owner-tenants-list.facade';
import { I18nService } from '../../../../core/services/i18n.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { OwnerTenantStatusesDataService } from '../../data-access/owner-tenant-statuses-data.service';
import { OwnerTenantsDataService } from '../../data-access/owner-tenants-data.service';

describe('OwnerTenantsListComponent', () => {
  const mockTenant = {
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
  } as const;

  const mockFacade = {
    searchQuery: signal(''),
    showFiltersDropdown: signal(false),
    activeStatusDropdown: signal<string | null>(null),
    pendingStatusChange: signal(null),
    activePlanDropdown: signal<string | null>(null),
    pendingPlanChange: signal(null),
    copyNotification: signal<string | null>(null),
    selectedStatuses: signal(new Set<string>()),
    selectedPlans: signal(new Set<string>()),
    selectedHealths: signal(new Set<string>()),
    statuses: signal(['Pending', 'Active', 'Suspended', 'Disabled', 'Blocked', 'Unknown']),
    plans: ['Starter', 'Professional'],
    healths: ['Healthy', 'Degraded', 'Down'],
    activeFilterCount: signal(0),
    filteredTenants: signal([mockTenant]),
    toggleFilter: () => {},
    clearFilters: () => {},
    requestStatusChange: () => {},
    confirmStatusChange: () => {},
    cancelStatusChange: () => {},
    requestPlanChange: () => {},
    confirmPlanChange: () => {},
    cancelPlanChange: () => {},
  };

  const mockI18n = {
    t: (text: string) => text,
    isRtl: signal(false),
  };

  const mockDashboardService = {
    returnUrl: signal(''),
    setRole: () => {},
  };

  const mockStatusesData = {
    findByName: (name: string) => ({ nameEn: name, color: '#d97706' }),
  };

  const mockTenantsData = {
    loadFromBackend: () => Promise.resolve(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerTenantsListComponent],
      providers: [
        provideRouter([]),
        { provide: OwnerTenantsListFacade, useValue: mockFacade },
        { provide: I18nService, useValue: mockI18n },
        { provide: DashboardService, useValue: mockDashboardService },
        { provide: OwnerTenantStatusesDataService, useValue: mockStatusesData },
        { provide: OwnerTenantsDataService, useValue: mockTenantsData },
      ],
    }).compileComponents();
  });

  it('renders separate backend status fields for each tenant row', () => {
    const fixture = TestBed.createComponent(OwnerTenantsListComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent.replace(/\s+/g, ' ');
    expect(text).toContain('Pending');
    expect(text).toContain('Payment: Pending');
    expect(text).toContain('Settlement: Unpaid');
    expect(text).toContain('Operational: Active');
  });
});
