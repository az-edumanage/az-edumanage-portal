import { OwnerTenantDetailsStore } from './owner-tenant-details.store';

describe('OwnerTenantDetailsStore', () => {
  it('tracks upgrade submitting state', () => {
    const store = new OwnerTenantDetailsStore();

    expect(store.isUpgrading()).toBeFalsy();
    store.setUpgrading(true);
    expect(store.isUpgrading()).toBeTruthy();
  });

  it('tracks billing history state independently', () => {
    const store = new OwnerTenantDetailsStore();
    const row = {
      id: 'invoice-1',
      invoice: 'REAL-2026-001',
      date: 'May 29, 2026',
      amount: '1,499 EGP',
      status: 'Open',
      downloadUrl: null,
    };

    expect(store.billingHistory()).toEqual([]);
    expect(store.billingHistoryLoading()).toBeFalsy();
    expect(store.billingHistoryError()).toBeNull();

    store.setBillingHistory([row]);
    store.setBillingHistoryLoading(true);
    store.setBillingHistoryError('Billing history could not be loaded.');

    expect(store.billingHistory()).toEqual([row]);
    expect(store.billingHistoryLoading()).toBeTruthy();
    expect(store.billingHistoryError()).toBe('Billing history could not be loaded.');
  });

  it('resets billing history without changing tenant load state', () => {
    const store = new OwnerTenantDetailsStore();

    store.setLoading(true);
    store.setBillingHistory([
      { id: 'invoice-1', invoice: 'REAL-2026-001', date: 'May 29, 2026', amount: '1,499 EGP', status: 'Open' },
    ]);
    store.setBillingHistoryLoading(true);
    store.setBillingHistoryError('Billing history could not be loaded.');

    store.resetBillingHistoryState();

    expect(store.billingHistory()).toEqual([]);
    expect(store.billingHistoryLoading()).toBeFalsy();
    expect(store.billingHistoryError()).toBeNull();
    expect(store.loading()).toBeTruthy();
  });
});
