import { TestBed } from '@angular/core/testing';
import { OwnerAuditLogsStore } from './owner-audit-logs.store';

describe('OwnerAuditLogsStore', () => {
  let store: OwnerAuditLogsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerAuditLogsStore);
  });

  it('returns all logs when search query is empty', () => {
    expect(store.filteredLogs().length).toBe(4);
  });

  it('filters logs by tenant or action query', () => {
    store.searchQuery.set('login');
    const filtered = store.filteredLogs();

    expect(filtered.length).toBe(1);
    expect(filtered[0].actionType).toBe('Login');
  });
});
