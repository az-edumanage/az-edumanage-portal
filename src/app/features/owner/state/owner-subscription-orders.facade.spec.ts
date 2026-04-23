import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DashboardService } from '../../../core/services/dashboard.service';
import { OwnerSubscriptionOrdersFacade } from './owner-subscription-orders.facade';

describe('OwnerSubscriptionOrdersFacade', () => {
  let facade: OwnerSubscriptionOrdersFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DashboardService,
          useValue: {
            pendingSubscriptionOrdersCount: signal(0),
          },
        },
      ],
    });

    facade = TestBed.inject(OwnerSubscriptionOrdersFacade);
  });

  it('should filter orders by search query', () => {
    facade.setSearchQuery('bright');

    expect(facade.filteredOrders().length).toBe(1);
    expect(facade.filteredOrders()[0].tenantName).toContain('Bright');
  });

  it('should process approve action and update order status', () => {
    const order = facade.orders().find((o) => o.status === 'Pending');
    expect(order).toBeTruthy();

    facade.openConfirmModal(order!, 'approve');
    facade.processAction();

    const updated = facade.orders().find((o) => o.id === order!.id);
    expect(updated?.status).toBe('Approved');
    expect(facade.showConfirmModal()).toBe(false);
  });
});
