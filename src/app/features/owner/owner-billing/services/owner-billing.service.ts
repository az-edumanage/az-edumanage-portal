import { Injectable, signal, computed } from '@angular/core';
import { Invoice, Payment, FailedPayment, Refund, MonthlyReport } from '../models/owner-billing.models';

@Injectable({
  providedIn: 'root'
})
export class OwnerBillingService {
  // --- Raw Data State (Mock Data) ---
  private allInvoices = signal<Invoice[]>([
    { id: 'INV-2024-001', tenant: 'Bright Future Academy', tenantId: 'tnt_001', plan: 'Enterprise', amount: 4990, issueDate: 'Jan 15, 2024', dueDate: 'Jan 15, 2024', status: 'Paid' },
    { id: 'INV-2024-002', tenant: 'Cairo Math Center', tenantId: 'tnt_002', plan: 'Professional', amount: 149, issueDate: 'Feb 02, 2024', dueDate: 'Feb 02, 2024', status: 'Paid' },
    { id: 'INV-2024-003', tenant: 'Physics Pro', tenantId: 'tnt_004', plan: 'Professional', amount: 149, issueDate: 'Feb 20, 2024', dueDate: 'Feb 20, 2024', status: 'Overdue' },
    { id: 'INV-2024-004', tenant: 'Language Hub', tenantId: 'tnt_005', plan: 'Starter', amount: 49, issueDate: 'Nov 05, 2023', dueDate: 'Nov 05, 2023', status: 'Cancelled' },
    { id: 'INV-2024-005', tenant: 'Elite Tutors', tenantId: 'tnt_003', plan: 'Starter', amount: 49, issueDate: 'Dec 10, 2023', dueDate: 'Dec 10, 2023', status: 'Paid' },
  ]);

  private allPayments = signal<Payment[]>([
    { id: 'PAY-9821', tenant: 'Bright Future Academy', tenantId: 'tnt_001', amount: 4990, method: 'Bank Transfer', status: 'Success', date: 'Jan 16, 2024', ref: 'TRX_998877' },
    { id: 'PAY-9822', tenant: 'Cairo Math Center', tenantId: 'tnt_002', amount: 149, method: 'Card', status: 'Success', date: 'Feb 02, 2024', ref: 'ch_1Ok...' },
    { id: 'PAY-9823', tenant: 'Physics Pro', tenantId: 'tnt_004', amount: 149, method: 'Card', status: 'Failed', date: 'Feb 20, 2024', ref: 'ch_1Om...' },
  ]);

  private allFailedPayments = signal<FailedPayment[]>([
    { id: 'FAIL-001', tenant: 'Physics Pro', amount: 149, reason: 'Insufficient Funds', retryCount: 1, lastAttempt: 'Feb 20, 2024', gracePeriodEnd: 'Feb 27, 2024' },
    { id: 'FAIL-002', tenant: 'Language Hub', amount: 49, reason: 'Card Expired', retryCount: 3, lastAttempt: 'Nov 08, 2023', gracePeriodEnd: 'Nov 15, 2023' },
  ]);

  private allRefunds = signal<Refund[]>([
    { id: 'REF-001', tenant: 'Demo School', originalInvoice: 'INV-2023-999', amount: 49, reason: 'Accidental Subscription', date: 'Jan 10, 2024' }
  ]);

  readonly monthlyReports = signal<MonthlyReport[]>([
    { month: 'Oct 2023', revenue: 98500, refunds: 1200, netRevenue: 97300, growth: 0, status: 'stable' },
    { month: 'Nov 2023', revenue: 102400, refunds: 850, netRevenue: 101550, growth: 4.3, status: 'up' },
    { month: 'Dec 2023', revenue: 115000, refunds: 1500, netRevenue: 113500, growth: 11.7, status: 'up' },
    { month: 'Jan 2024', revenue: 121000, refunds: 900, netRevenue: 120100, growth: 5.8, status: 'up' },
    { month: 'Feb 2024', revenue: 118500, refunds: 2400, netRevenue: 116100, growth: -3.3, status: 'down' },
    { month: 'Mar 2024', revenue: 142300, refunds: 320, netRevenue: 141980, growth: 22.3, status: 'up' },
  ]);

  // --- Filtering State ---
  tenantFilter = signal<string | null>(null);
  searchQuery = signal<string>('');
  filterStatus = signal<string>('All');
  filterDateStart = signal<string>('');
  filterDateEnd = signal<string>('');
  filterMinAmount = signal<number | null>(null);
  filterMaxAmount = signal<number | null>(null);

  // --- Computed Selectors ---
  readonly maxRevenue = computed(() => {
    return Math.max(...this.monthlyReports().map(r => r.netRevenue));
  });

  readonly isFiltered = computed(() => {
    return this.searchQuery() !== '' || 
           this.tenantFilter() !== null || 
           this.filterStatus() !== 'All' || 
           this.filterMinAmount() !== null || 
           this.filterMaxAmount() !== null;
  });

  readonly filteredInvoices = computed(() => {
    let results = this.allInvoices();
    const tenant = this.tenantFilter();
    const query = this.searchQuery().toLowerCase();
    const status = this.filterStatus();
    const min = this.filterMinAmount();
    const max = this.filterMaxAmount();

    if (tenant) {
      results = results.filter(inv => inv.tenant.toLowerCase().includes(tenant.toLowerCase()));
    }
    if (query) {
      results = results.filter(inv => 
        inv.id.toLowerCase().includes(query) || 
        inv.tenant.toLowerCase().includes(query) ||
        inv.plan.toLowerCase().includes(query)
      );
    }
    if (status !== 'All') {
      results = results.filter(inv => inv.status === status);
    }
    if (min !== null) {
      results = results.filter(inv => inv.amount >= min);
    }
    if (max !== null) {
      results = results.filter(inv => inv.amount <= max);
    }
    return results;
  });

  readonly filteredPayments = computed(() => {
    let results = this.allPayments();
    const tenant = this.tenantFilter();
    const query = this.searchQuery().toLowerCase();

    if (tenant) {
      results = results.filter(p => p.tenant.toLowerCase().includes(tenant.toLowerCase()));
    }
    if (query) {
      results = results.filter(p => 
        p.id.toLowerCase().includes(query) || 
        p.tenant.toLowerCase().includes(query) ||
        p.ref.toLowerCase().includes(query)
      );
    }
    return results;
  });

  readonly filteredFailedPayments = computed(() => {
    let results = this.allFailedPayments();
    const tenant = this.tenantFilter();
    const query = this.searchQuery().toLowerCase();

    if (tenant) {
      results = results.filter(f => f.tenant.toLowerCase().includes(tenant.toLowerCase()));
    }
    if (query) {
      results = results.filter(f => 
        f.tenant.toLowerCase().includes(query) || 
        f.reason.toLowerCase().includes(query)
      );
    }
    return results;
  });

  readonly filteredRefunds = computed(() => {
    let results = this.allRefunds();
    const tenant = this.tenantFilter();
    const query = this.searchQuery().toLowerCase();

    if (tenant) {
      results = results.filter(r => r.tenant.toLowerCase().includes(tenant.toLowerCase()));
    }
    if (query) {
      results = results.filter(r => 
        r.id.toLowerCase().includes(query) || 
        r.tenant.toLowerCase().includes(query) ||
        r.reason.toLowerCase().includes(query)
      );
    }
    return results;
  });

  // --- Actions ---
  resetFilters() {
    this.filterStatus.set('All');
    this.filterMinAmount.set(null);
    this.filterMaxAmount.set(null);
    this.filterDateStart.set('');
    this.filterDateEnd.set('');
    this.searchQuery.set('');
    this.tenantFilter.set(null);
  }

  setTenantFilter(tenantId: string | null) {
    this.tenantFilter.set(tenantId);
  }

  confirmPayment(invoiceId: string) {
    this.allInvoices.update(invoices => 
      invoices.map(inv => inv.id === invoiceId ? { ...inv, status: 'Paid' } : inv)
    );
  }

  processRefund(invoice: Invoice, reason = 'Customer Request') {
    // Update invoice status
    this.allInvoices.update(invoices => 
      invoices.map(inv => inv.id === invoice.id ? { ...inv, status: 'Refunded' } : inv)
    );
    
    // Add refund record
    const newRefund: Refund = {
      id: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      tenant: invoice.tenant,
      originalInvoice: invoice.id,
      amount: invoice.amount,
      reason,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    };
    
    this.allRefunds.update(refunds => [newRefund, ...refunds]);
  }

  generateReport() {
    // Business logic to generate standard/PDF report
    console.log('Generating latest financial report...');
  }
}
