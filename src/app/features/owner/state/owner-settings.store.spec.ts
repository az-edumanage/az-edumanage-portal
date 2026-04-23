import { TestBed } from '@angular/core/testing';
import { SubscriptionPresetService } from '../../../core/services/subscription-preset.service';
import { OwnerSettingsStore } from './owner-settings.store';

describe('OwnerSettingsStore', () => {
  let store: OwnerSettingsStore;
  let presetService: SubscriptionPresetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OwnerSettingsStore);
    presetService = TestBed.inject(SubscriptionPresetService);
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

  it('saves presets back to core preset service', () => {
    store.addPaymentMethod();
    const createdId = store.paymentMethods().at(-1)?.id;

    if (createdId) {
      store.removePaymentMethod(createdId);
    }

    store.savePresets();

    expect(presetService.cycles().length).toBe(store.subscriptionCycles().length);
    expect(presetService.paymentMethods().length).toBe(store.paymentMethods().length);
  });
});
