import { TestBed } from '@angular/core/testing';
import { TenantGroupBroadcastStore } from './tenant-group-broadcast.store';

describe('TenantGroupBroadcastStore', () => {
  let store: TenantGroupBroadcastStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TenantGroupBroadcastStore);
    store.loadGroup('g-1');
  });

  it('does not send empty messages', () => {
    store.setNewMessage('   ');

    const didSend = store.sendMessage();

    expect(didSend).toBe(false);
    expect(store.messages().length).toBe(4);
  });

  it('adds outgoing message and clears input', () => {
    store.setNewMessage('Hello class');

    const didSend = store.sendMessage();

    expect(didSend).toBe(true);
    expect(store.messages().length).toBe(5);
    expect(store.messages().at(-1)?.text).toBe('Hello class');
    expect(store.newMessage()).toBe('');
  });
});
