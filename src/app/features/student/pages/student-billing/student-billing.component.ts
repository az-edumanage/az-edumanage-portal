import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { StudentDashboardDataService } from '../../data-access/student-dashboard-data.service';
import { StudentInvoice } from '../../models/student-dashboard.models';

@Component({
  selector: 'app-student-billing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page">
      <header><h1>Billing</h1><p>Only invoices linked to your student account are shown here.</p></header>
      @if (loading()) { <div class="state">Loading invoices...</div> }
      @else if (error()) { <div class="state error">{{ error() }}</div> }
      @else {
        <div class="table">
          <table>
            <thead><tr><th>Invoice</th><th>Group</th><th>Amount</th><th>Period</th><th>Due date</th><th>Status</th></tr></thead>
            <tbody>
              @for (invoice of invoices(); track invoice.id) {
                <tr>
                  <td><strong>{{ invoice.invoiceRef }}</strong></td>
                  <td>{{ invoice.groupName }}</td>
                  <td>{{ invoice.amount | number: '1.2-2' }} {{ invoice.currency }}</td>
                  <td>{{ invoice.billingPeriodStart || '-' }} to {{ invoice.billingPeriodEnd || '-' }}</td>
                  <td>{{ invoice.dueDate || '-' }}</td>
                  <td><span class="pill" [class.warn]="invoice.status === 'UNPAID'">{{ invoice.status }}</span></td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty">No invoices found for your account.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styleUrl: '../student-shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentBillingComponent implements OnInit {
  private readonly data = inject(StudentDashboardDataService);
  readonly invoices = signal<StudentInvoice[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  ngOnInit(): void { void this.load(); }
  async load(): Promise<void> {
    this.loading.set(true); this.error.set(null);
    try { this.invoices.set(await firstValueFrom(this.data.invoices())); }
    catch (error) { this.error.set(error instanceof Error ? error.message : 'Unable to load invoices'); }
    finally { this.loading.set(false); }
  }
}
