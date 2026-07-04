import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ParentDashboardDataService } from '../../data-access/parent-dashboard-data.service';
import { ParentOverview } from '../../models/parent-dashboard.models';

@Component({
  selector: 'app-parent-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <section class="parent-page">
      <header class="parent-head">
        <div>
          <p class="parent-eyebrow">Parent portal</p>
          <h1>Parent dashboard</h1>
          <p>Track children, attendance, invoices, and exam reports from one place.</p>
        </div>
      </header>

      @if (loading()) {
        <div class="state">Loading overview...</div>
      } @else if (error()) {
        <div class="state error">{{ error() }}</div>
      } @else if (overview(); as data) {
        <div class="metrics">
          <a routerLink="/parent/students" class="metric-card">
            <mat-icon>school</mat-icon>
            <span>Childs</span>
            <strong>{{ data.summary.childrenCount }}</strong>
          </a>
          <a routerLink="/parent/attendance" class="metric-card">
            <mat-icon>fact_check</mat-icon>
            <span>Recorded Attendance</span>
            <strong>{{ data.summary.totalRecordedAttendance }}</strong>
          </a>
          <a routerLink="/parent/overview" class="metric-card">
            <mat-icon>calendar_today</mat-icon>
            <span>Weekly Sessions</span>
            <strong>{{ data.summary.weeklySessionsCount }}</strong>
          </a>
          <a routerLink="/parent/billing" class="metric-card">
            <mat-icon>receipt_long</mat-icon>
            <span>Unpaid Invoices</span>
            <strong>{{ data.summary.unpaidInvoicesCount }}</strong>
          </a>
        </div>

        <div class="chart-grid">
          <section class="panel attendance-panel">
            <div class="panel-head">
              <h2>Attendance</h2>
              <a routerLink="/parent/attendance">View list</a>
            </div>
            <div class="attendance-chart">
              <div class="donut" [style.background]="attendanceDonut(data)">
                <span>{{ data.attendance.attendanceRate }}%</span>
              </div>
              <div class="legend">
                <div><span class="dot present"></span><strong>{{ data.attendance.presentCount }}</strong> Present</div>
                <div><span class="dot absent"></span><strong>{{ data.attendance.absentCount }}</strong> Absent</div>
                <div><span class="dot muted"></span><strong>{{ data.summary.totalRecordedAttendance }}</strong> Total</div>
              </div>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <h2>Attendance by child</h2>
              <a routerLink="/parent/students">Childs</a>
            </div>
            <div class="bar-chart">
              @for (child of data.childAttendance; track child.studentName) {
                <div class="bar-row">
                  <span>{{ child.studentName }}</span>
                  <div><i [style.width.%]="child.attendanceRate"></i></div>
                  <strong>{{ child.attendanceRate }}%</strong>
                </div>
              } @empty {
                <p class="empty-copy">Attendance will appear after sessions are recorded.</p>
              }
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <h2>Invoice status</h2>
              <a routerLink="/parent/billing">Billing</a>
            </div>
            <div class="bar-chart">
              @for (status of invoiceBars(data); track status.label) {
                <div class="bar-row invoice">
                  <span>{{ status.label }}</span>
                  <div><i [style.width.%]="status.percent"></i></div>
                  <strong>{{ status.value }}</strong>
                </div>
              } @empty {
                <p class="empty-copy">No invoices found for linked students.</p>
              }
            </div>
          </section>
        </div>

        <div class="content-grid">
          <section class="panel">
            <div class="panel-head">
              <h2>Recent attendance</h2>
              <a routerLink="/parent/attendance">Open attendance</a>
            </div>
            @for (row of data.recentAttendance; track row.id) {
              <div class="row">
                <mat-icon>schedule</mat-icon>
                <div>
                  <strong>{{ row.studentName }}</strong>
                  <span>{{ row.groupName || 'Group' }} · {{ row.sessionDate || '-' }} · {{ row.arrivalTime ? dateTime(row.arrivalTime) : 'No arrival time' }}</span>
                </div>
                <em [class.warn]="isAbsent(row.status)">{{ row.status }}</em>
              </div>
            } @empty {
              <p class="empty-copy">No attendance has been recorded yet.</p>
            }
          </section>

          <section class="panel">
            <div class="panel-head">
              <h2>Recent invoices</h2>
              <a routerLink="/parent/billing">Open billing</a>
            </div>
            @for (invoice of data.recentInvoices; track invoice.id) {
              <div class="row">
                <mat-icon>receipt_long</mat-icon>
                <div>
                  <strong>{{ invoice.invoiceRef }} · {{ invoice.studentName }}</strong>
                  <span>{{ invoice.groupName }} · {{ invoice.amount | number: '1.2-2' }} {{ invoice.currency }} · Due {{ invoice.dueDate || '-' }}</span>
                </div>
                <em [class.warn]="invoice.status === 'UNPAID'">{{ invoice.status }}</em>
              </div>
            } @empty {
              <p class="empty-copy">No invoices found for linked students.</p>
            }
          </section>
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .parent-page { display: grid; gap: 24px; }
    .parent-head { display: flex; justify-content: space-between; gap: 16px; }
    .parent-eyebrow { margin: 0 0 6px; color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
    h1 { margin: 0; color: #020617; font-size: 28px; font-weight: 900; }
    p { margin: 6px 0 0; color: #64748b; font-weight: 600; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
    .metric-card, .panel, .state { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; box-shadow: 0 4px 8px rgb(15 23 42 / .04); }
    .metric-card { display: grid; gap: 10px; padding: 18px; color: inherit; text-decoration: none; }
    .metric-card mat-icon { color: #4f46e5; }
    .metric-card span { color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; }
    .metric-card strong { color: #020617; font-size: 26px; }
    .chart-grid { display: grid; grid-template-columns: minmax(280px, 1fr) minmax(280px, 1.1fr) minmax(260px, .9fr); gap: 16px; }
    .content-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
    .panel { padding: 18px; }
    .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    h2 { margin: 0; color: #020617; font-size: 16px; font-weight: 900; }
    a { color: #4f46e5; font-size: 13px; font-weight: 800; }
    .attendance-chart { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 18px; }
    .donut { position: relative; width: 132px; height: 132px; display: grid; place-items: center; border-radius: 50%; }
    .donut::after { content: ''; position: absolute; inset: 18px; border-radius: inherit; background: #fff; }
    .donut span { position: relative; z-index: 1; color: #020617; font-size: 24px; font-weight: 900; }
    .legend { display: grid; gap: 10px; color: #475569; font-size: 13px; font-weight: 800; }
    .legend div { display: flex; align-items: center; gap: 8px; }
    .legend strong { color: #020617; font-size: 15px; }
    .dot { width: 10px; height: 10px; border-radius: 999px; background: #cbd5e1; }
    .dot.present { background: #10b981; }
    .dot.absent { background: #ef4444; }
    .dot.muted { background: #94a3b8; }
    .bar-chart { display: grid; gap: 12px; }
    .bar-row { display: grid; grid-template-columns: minmax(76px, 132px) 1fr 44px; align-items: center; gap: 10px; color: #475569; font-size: 12px; font-weight: 900; }
    .bar-row div { height: 10px; overflow: hidden; border-radius: 999px; background: #eef2ff; }
    .bar-row i { display: block; height: 100%; min-width: 4px; border-radius: inherit; background: #4f46e5; }
    .bar-row.invoice div { background: #fff7ed; }
    .bar-row.invoice i { background: #f97316; }
    .bar-row strong { color: #0f172a; text-align: right; }
    .row { display: grid; grid-template-columns: auto 1fr auto; align-items: start; gap: 12px; padding: 12px 0; border-top: 1px solid #f1f5f9; }
    .row mat-icon { color: #64748b; }
    .row div { display: grid; gap: 2px; }
    .row strong { color: #0f172a; }
    .row span, .empty-copy { color: #64748b; font-size: 13px; font-weight: 600; }
    .row em { display: inline-flex; min-height: 24px; align-items: center; padding: 0 10px; border-radius: 999px; background: #ecfdf5; color: #047857; font-size: 12px; font-style: normal; font-weight: 900; }
    .row em.warn { background: #fff7ed; color: #c2410c; }
    .state { padding: 18px; color: #64748b; font-weight: 800; }
    .state.error { border-color: #fecdd3; background: #fff1f2; color: #be123c; }
    :host-context(.dark) h1, :host-context(.dark) h2, :host-context(.dark) .metric-card strong, :host-context(.dark) .donut span, :host-context(.dark) .legend strong, :host-context(.dark) .bar-row strong, :host-context(.dark) .row strong { color: #f8fafc; }
    :host-context(.dark) p, :host-context(.dark) .parent-eyebrow, :host-context(.dark) .metric-card span, :host-context(.dark) .legend, :host-context(.dark) .bar-row, :host-context(.dark) .row span, :host-context(.dark) .empty-copy, :host-context(.dark) .state { color: #94a3b8; }
    :host-context(.dark) .metric-card, :host-context(.dark) .panel, :host-context(.dark) .state { border-color: #334155; background: #0f172a; box-shadow: none; }
    :host-context(.dark) .donut::after { background: #0f172a; }
    :host-context(.dark) .bar-row div { background: #1e293b; }
    :host-context(.dark) .bar-row.invoice div { background: #2b1d10; }
    :host-context(.dark) .row { border-color: #1e293b; }
    @media (max-width: 1120px) { .chart-grid { grid-template-columns: 1fr; } }
    @media (max-width: 560px) {
      .attendance-chart { grid-template-columns: 1fr; }
      .donut { width: 116px; height: 116px; }
      .row { grid-template-columns: auto 1fr; }
      .row em { grid-column: 2; width: max-content; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentOverviewComponent implements OnInit {
  private readonly data = inject(ParentDashboardDataService);
  readonly overview = signal<ParentOverview | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try { this.overview.set(await firstValueFrom(this.data.overview())); }
    catch (error) { this.error.set(error instanceof Error ? error.message : 'Unable to load parent overview'); }
    finally { this.loading.set(false); }
  }

  attendanceDonut(data: ParentOverview): string {
    const rate = Math.max(0, Math.min(100, data.attendance.attendanceRate || 0));
    return `conic-gradient(#10b981 0 ${rate}%, #ef4444 ${rate}% 100%)`;
  }

  invoiceBars(data: ParentOverview): Array<{ label: string; value: number; percent: number }> {
    const max = Math.max(1, ...data.invoiceStatus.map((item) => item.count));
    return data.invoiceStatus.map((item) => ({
      label: item.status,
      value: item.count,
      percent: item.count === 0 ? 0 : Math.max(8, Math.round((item.count / max) * 100)),
    }));
  }

  isAbsent(status: string | null | undefined): boolean {
    return String(status ?? '').toLowerCase() === 'absent';
  }

  dateTime(value: string): string {
    return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
}
