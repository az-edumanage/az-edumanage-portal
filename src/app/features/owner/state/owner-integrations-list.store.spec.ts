import { TestBed } from '@angular/core/testing';
import { OwnerIntegrationsListStore } from './owner-integrations-list.store';

describe('OwnerIntegrationsListStore', () => {
  let store: OwnerIntegrationsListStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerIntegrationsListStore);
  });

  it('returns all integrations by default', () => {
    expect(store.filter()).toBe('All');
    expect(store.filteredIntegrations().length).toBe(6);
  });

  it('filters integrations by selected type', () => {
    store.filter.set('SMS');
    const filtered = store.filteredIntegrations();

    expect(filtered.length).toBe(2);
    expect(filtered.every((integration) => integration.type === 'SMS')).toBe(true);
  });
});
