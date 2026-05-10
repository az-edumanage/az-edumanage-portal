import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { SubscriptionPresetService } from '../../../core/services/subscription-preset.service';
import { OwnerSettingsStore } from './owner-settings.store';

describe('OwnerSettingsStore', () => {
  let store: OwnerSettingsStore;
  let presetService: SubscriptionPresetService;

  beforeEach(() => {
    localStorage.setItem('beedu.auth.token', 'test-token');
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    store = TestBed.inject(OwnerSettingsStore);
    presetService = TestBed.inject(SubscriptionPresetService);
  });

  afterEach(() => {
    localStorage.removeItem('beedu.auth.token');
  });

  it('adds and removes cycles', () => {
    const initial = store.subscriptionCycles().length;

    store.addCycle();
    expect(store.subscriptionCycles().length).toBe(initial + 1);

    const createdId = store.subscriptionCycles().at(-1)?.id;
    if (createdId) {
      store.removeCycle(createdId);
    }

    expect(store.subscriptionCycles().length).toBe(initial);
  });

  it('adds and removes payment methods locally', () => {
    const initial = store.paymentMethods().length;

    store.addPaymentMethod();
    expect(store.paymentMethods().length).toBe(initial + 1);

    const createdId = store.paymentMethods().at(-1)?.id;
    if (createdId) {
      store.removePaymentMethod(createdId);
    }

    expect(store.paymentMethods().length).toBe(initial);
  });

  it('exposes activeTab and subjectTemplates signals', () => {
    expect(store.activeTab()).toBe('general');
    expect(store.subjectTemplates().length).toBe(2);
    expect(typeof store.setActiveTab).toBe('function');
  });
});
