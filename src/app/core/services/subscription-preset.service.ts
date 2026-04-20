import { Injectable, signal } from '@angular/core';

export interface SubscriptionCycle {
  id: number;
  name: string;
  days: number;
  icon: string;
  active: boolean;
}

export interface PaymentMethod {
  id: number;
  name: string;
  description: string;
  icon: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionPresetService {
  readonly cycles = signal<SubscriptionCycle[]>([
    { id: 1, name: 'Weekly', days: 7, icon: 'calendar_view_week', active: true },
    { id: 2, name: 'Monthly', days: 30, icon: 'calendar_view_month', active: true },
    { id: 3, name: 'Quarterly', days: 90, icon: 'grid_view', active: true },
    { id: 4, name: 'Semester', days: 120, icon: 'school', active: true },
    { id: 5, name: 'Yearly', days: 365, icon: 'calendar_today', active: true },
    { id: 6, name: 'Custom', days: 0, icon: 'edit_calendar', active: true },
  ]);

  readonly paymentMethods = signal<PaymentMethod[]>([
    { id: 1, name: 'Wallet Transfer', description: 'Vodafone Cash, Orange Money, etc.', icon: 'account_balance_wallet', active: true },
    { id: 2, name: 'InstaPay', description: 'Direct bank transfer via InstaPay app', icon: 'account_balance', active: true },
    { id: 3, name: 'Payment Gateway', description: 'Stripe, PayPal, Paymob', icon: 'payments', active: true },
  ]);

  updateCycles(newCycles: SubscriptionCycle[]) {
    this.cycles.set(newCycles);
  }

  updatePaymentMethods(newMethods: PaymentMethod[]) {
    this.paymentMethods.set(newMethods);
  }
}
