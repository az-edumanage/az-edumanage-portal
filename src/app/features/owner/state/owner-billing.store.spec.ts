import { TestBed } from '@angular/core/testing';
import { OwnerBillingStore } from './owner-billing.store';

describe('OwnerBillingStore', () => {
  let store: OwnerBillingStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerBillingStore);
  });

  it('should initialize with invoices tab', () => {
    expect(store.activeTab()).toBe('invoices');
  });

  it('should change active tab', () => {
    store.setActiveTab('payments');
    expect(store.activeTab()).toBe('payments');
  });

  it('should toggle advanced filters', () => {
    expect(store.showAdvancedFilters()).toBe(false);
    store.toggleAdvancedFilters();
    expect(store.showAdvancedFilters()).toBe(true);
  });
});
