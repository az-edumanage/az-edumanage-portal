import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { OwnerTenantDetailsComponent } from './owner-tenant-details.component';
import { OwnerTenantDetailsFacade } from '../../state/owner-tenant-details.facade';

describe('OwnerTenantDetailsComponent', () => {
  const tenant = {
    id: 'tenant-1',
    centerName: 'Hussein School',
    tenantType: 'Center',
    subdomain: 'hussein',
    domain: 'az-edumanage.com',
    industry: 'Education',
    contactName: 'Admin',
    contactEmail: 'admin@example.com',
    contactPhone: '123',
    address: 'Street',
    city: 'Cairo',
    country: 'Egypt',
    planId: 'plan-1',
    planName: 'Growth',
    isTrial: false,
    trialDays: 0,
    region: 'me-south-1',
    autoProvision: true,
    sendInvite: true,
    onboardingLink: false,
    sendOnboardingWhatsapp: false,
    sendOnboardingEmail: false,
    schemaName: 'tenant_hussein',
    provisioningStatus: 'Failed',
    provisioningError: 'Migration failed',
    isActive: false,
    tenantOperationalStatus: 'Suspended',
    ownerDisplayStatus: 'Pending',
    subscriptionState: 'production',
    subscriptionType: 'production',
    subscriptionStartedAt: '—',
    currentPeriodStartAt: '—',
    currentPeriodEndAt: '—',
    billingStatus: '—',
    openInvoice: null,
    providerPaymentStatus: 'unknown',
    settlementStatus: 'unknown',
    createdBy: 'admin',
    provisioningSource: 'Owner Manual',
    provisioningTriggeredBy: 'admin',
    status: 'Pending',
    createdDate: 'Today',
    updatedDate: 'Today',
    addressDisplay: 'Street, Cairo, Egypt',
    tenantUrl: 'hussein.az-edumanage.com',
    nextBillingDate: '—',
    usageStudents: '0',
    usageStudentsLimit: '100',
    usageStorage: '0 GB',
    usageStorageLimit: '10 GB',
    usageApiCalls: '0',
    usageApiCallsLimit: '1000',
  };

  const facade = {
    showPlanDropdown: signal(false),
    pendingPlanId: signal(null),
    isUpgrading: signal(false),
    loading: signal(false),
    loadError: signal(null),
    notFound: signal(false),
    billingHistoryLoading: signal(false),
    billingHistoryError: signal(null),
    plans: [],
    tenant,
    modules: [],
    billingHistory: [],
    billingStatus: '—',
    openInvoice: null,
    initialize: vi.fn(),
    selectPlan: vi.fn(),
    confirmUpgrade: vi.fn(),
    cancelUpgrade: vi.fn(),
    getCurrentPlanPrice: vi.fn(() => '—'),
    getPendingPlanName: vi.fn(() => ''),
    impersonate: vi.fn(),
    retryProvisioning: vi.fn(),
    goBack: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OwnerTenantDetailsComponent],
      providers: [
        provideRouter([]),
        { provide: OwnerTenantDetailsFacade, useValue: facade },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([['id', 'tenant-1']])),
          },
        },
      ],
    });
  });

  it('renders provisioning readiness status and retry action', () => {
    const fixture = TestBed.createComponent(OwnerTenantDetailsComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Provisioning Readiness');
    expect(text).toContain('Failed');
    expect(text).toContain('tenant_hussein');
    expect(text).toContain('Retry');
  });
});
