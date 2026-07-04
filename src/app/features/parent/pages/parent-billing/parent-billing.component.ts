import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ParentDashboardDataService } from '../../data-access/parent-dashboard-data.service';
import { ParentInvoice } from '../../models/parent-dashboard.models';

@Component({
  selector: 'app-parent-billing',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <section class="page">
      <header><h1>Billing</h1><p>Invoices for the students linked to your parent account.</p></header>
      @if (loading()) { <div class="state">Loading invoices...</div> }
      @else if (error()) { <div class="state error">{{ error() }}</div> }
      @else {
        <div class="table">
          <div class="table-toolbar">
            <label class="search-field">
              <mat-icon>search</mat-icon>
              <input type="search" placeholder="Search invoices" [value]="searchTerm()" (input)="setSearchTerm($any($event.target).value)" />
            </label>
          </div>
          <table>
            <thead><tr><th>Invoice</th><th>Student</th><th>Group</th><th>Amount</th><th>Period</th><th>Due date</th><th>Status</th></tr></thead>
            <tbody>
              @for (invoice of pagedInvoices(); track invoice.id) {
                <tr>
                  <td><strong>{{ invoice.invoiceRef }}</strong></td>
                  <td>{{ invoice.studentName }}</td>
                  <td>{{ invoice.groupName }}</td>
                  <td>{{ invoice.amount | number: '1.2-2' }} {{ invoice.currency }}</td>
                  <td>{{ invoice.billingPeriodStart || '-' }} to {{ invoice.billingPeriodEnd || '-' }}</td>
                  <td>{{ invoice.dueDate || '-' }}</td>
                  <td><span class="pill" [class.warn]="invoice.status === 'UNPAID'">{{ invoice.status }}</span></td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="empty">{{ searchTerm() ? 'No invoices match your search.' : 'No invoices found for linked students.' }}</td></tr>
              }
            </tbody>
          </table>
          @if (filteredInvoices().length > 0) {
            <div class="pagination">
              <span>Showing {{ rangeStart() }}-{{ rangeEnd() }} of {{ filteredInvoices().length }}</span>
              <label>Rows <select [value]="pageSize()" (change)="setPageSize($any($event.target).value)"><option value="5">5</option><option value="10">10</option><option value="20">20</option></select></label>
              <button type="button" (click)="previousPage()" [disabled]="page() === 1" aria-label="Previous page"><mat-icon>chevron_left</mat-icon></button>
              <strong>Page {{ page() }} of {{ totalPages() }}</strong>
              <button type="button" (click)="nextPage()" [disabled]="page() === totalPages()" aria-label="Next page"><mat-icon>chevron_right</mat-icon></button>
            </div>
          }
        </div>
      }
    </section>
  `,
  styleUrl: '../../../student/pages/student-shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentBillingComponent implements OnInit {
  private readonly data = inject(ParentDashboardDataService);
  readonly invoices = signal<ParentInvoice[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly filteredInvoices = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) return this.invoices();
    return this.invoices().filter((invoice) => [
      invoice.invoiceRef,
      invoice.studentName,
      invoice.groupName,
      invoice.amount,
      invoice.currency,
      invoice.billingPeriodStart,
      invoice.billingPeriodEnd,
      invoice.dueDate,
      invoice.status,
    ].join(' ').toLowerCase().includes(query));
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredInvoices().length / this.pageSize())));
  readonly pagedInvoices = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredInvoices().slice(start, start + this.pageSize());
  });
  readonly rangeStart = computed(() => this.filteredInvoices().length === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  readonly rangeEnd = computed(() => Math.min(this.filteredInvoices().length, this.page() * this.pageSize()));

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.loading.set(true); this.error.set(null);
    try { this.invoices.set(await firstValueFrom(this.data.invoices())); this.page.set(1); }
    catch (error) { this.error.set(error instanceof Error ? error.message : 'Unable to load invoices'); }
    finally { this.loading.set(false); }
  }

  setSearchTerm(value: string): void { this.searchTerm.set(value); this.page.set(1); }
  setPageSize(value: string): void { const size = Number(value); this.pageSize.set(Number.isNaN(size) ? 10 : size); this.page.set(1); }
  previousPage(): void { this.page.update((page) => Math.max(1, page - 1)); }
  nextPage(): void { this.page.update((page) => Math.min(this.totalPages(), page + 1)); }
}
