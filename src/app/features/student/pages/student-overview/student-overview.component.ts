import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { StudentDashboardDataService } from '../../data-access/student-dashboard-data.service';
import { StudentDashboard, StudentExam, StudentScheduleSession } from '../../models/student-dashboard.models';

@Component({
  selector: 'app-student-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <section class="student-page">
      <header class="student-head">
        <div>
          <p class="student-eyebrow">Student portal</p>
          <h1>{{ dashboard()?.student?.name || 'Student dashboard' }}</h1>
          <p>Review your weekly schedule, assigned work, invoices, and groups from one place.</p>
        </div>
      </header>

      @if (loading()) {
        <div class="student-state">Loading overview...</div>
      } @else if (error()) {
        <div class="student-state student-state--error">{{ error() }}</div>
      } @else if (dashboard(); as data) {
        <div class="student-metrics">
          <a routerLink="/student/my-groups" class="student-card">
            <mat-icon>groups</mat-icon>
            <span>My Groups</span>
            <strong>{{ data.summary.groupsCount }}</strong>
          </a>
          <a routerLink="/student/schedule" class="student-card">
            <mat-icon>calendar_today</mat-icon>
            <span>Weekly Sessions</span>
            <strong>{{ data.summary.weeklySessionsCount }}</strong>
          </a>
          <a routerLink="/student/exams" class="student-card">
            <mat-icon>assignment</mat-icon>
            <span>Exams</span>
            <strong>{{ data.summary.examsCount }}</strong>
          </a>
          <a routerLink="/student/billing" class="student-card">
            <mat-icon>receipt_long</mat-icon>
            <span>Unpaid Invoices</span>
            <strong>{{ data.summary.unpaidInvoicesCount }}</strong>
          </a>
        </div>

        <div class="chart-grid">
          <section class="student-panel chart-panel attendance-panel">
            <div class="student-panel-head">
              <h2>Attendance</h2>
              <span class="panel-note">{{ data.attendance.totalRecorded }} recorded sessions</span>
            </div>
            <div class="attendance-chart">
              <div class="donut" [style.background]="attendanceDonut(data)">
                <span>{{ data.attendance.attendanceRate }}%</span>
              </div>
              <div class="attendance-legend">
                <div><span class="dot present"></span><strong>{{ data.attendance.presentCount }}</strong> Present</div>
                <div><span class="dot absent"></span><strong>{{ data.attendance.absentCount }}</strong> Absent</div>
                <div><span class="dot muted"></span><strong>{{ data.attendance.totalRecorded }}</strong> Total</div>
              </div>
            </div>
            <div class="recent-attendance" aria-label="Recent attendance">
              @for (point of data.attendance.recent; track point.date + point.status) {
                <span [class.present]="isPresent(point.status)" [title]="date(point.date) + ' · ' + point.status">
                  {{ shortDay(point.date) }}
                </span>
              } @empty {
                <p class="student-empty">Attendance will appear after sessions are recorded.</p>
              }
            </div>
          </section>

          <section class="student-panel chart-panel">
            <div class="student-panel-head">
              <h2>Weekly Sessions</h2>
              <a routerLink="/student/schedule">Calendar</a>
            </div>
            <div class="bar-chart">
              @for (bar of scheduleBars(data.upcomingSessions); track bar.label) {
                <div class="bar-row">
                  <span>{{ bar.label }}</span>
                  <div><i [style.width.%]="bar.percent"></i></div>
                  <strong>{{ bar.value }}</strong>
                </div>
              }
            </div>
          </section>

          <section class="student-panel chart-panel">
            <div class="student-panel-head">
              <h2>Assigned Work</h2>
              <a routerLink="/student/home-work">Open</a>
            </div>
            <div class="bar-chart">
              @for (bar of workStatusBars(data.upcomingExams); track bar.label) {
                <div class="bar-row work">
                  <span>{{ bar.label }}</span>
                  <div><i [style.width.%]="bar.percent"></i></div>
                  <strong>{{ bar.value }}</strong>
                </div>
              } @empty {
                <p class="student-empty">No assigned work yet.</p>
              }
            </div>
          </section>
        </div>

        <div class="student-grid">
          <section class="student-panel">
            <div class="student-panel-head">
              <h2>Upcoming Schedule</h2>
              <a routerLink="/student/schedule">View schedule</a>
            </div>
            @for (session of data.upcomingSessions; track session.id) {
              <div class="student-row">
                <mat-icon>schedule</mat-icon>
                <div>
                  <strong>{{ session.groupName }}</strong>
                  <span>{{ session.day }} {{ time(session.startTime) }} · {{ session.roomName || 'No room' }}</span>
                </div>
              </div>
            } @empty {
              <p class="student-empty">No scheduled sessions yet.</p>
            }
          </section>

          <section class="student-panel">
            <div class="student-panel-head">
              <h2>Assigned Work</h2>
              <a routerLink="/student/home-work">View home work</a>
            </div>
            @for (exam of data.upcomingExams; track exam.id) {
              <div class="student-row">
                <mat-icon>assignment</mat-icon>
                <div>
                  <strong>{{ exam.title }}</strong>
                  <span>{{ exam.groupName }} · {{ date(exam.date) }}</span>
                </div>
              </div>
            } @empty {
              <p class="student-empty">No assigned exams or home work yet.</p>
            }
          </section>
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .student-page { display: grid; gap: 24px; }
    .student-head { display: flex; justify-content: space-between; gap: 16px; }
    .student-eyebrow { margin: 0 0 6px; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: .06em; }
    h1 { margin: 0; font-size: 28px; font-weight: 900; color: #020617; }
    p { margin: 6px 0 0; color: #64748b; font-weight: 600; }
    .student-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
    .student-card, .student-panel { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; box-shadow: 0 4px 8px rgb(15 23 42 / .04); }
    .student-card { display: grid; gap: 10px; padding: 18px; text-decoration: none; color: inherit; }
    .student-card mat-icon { color: #4f46e5; }
    .student-card span { color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; }
    .student-card strong { font-size: 26px; color: #020617; }
    .student-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .student-panel { padding: 18px; }
    .student-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    h2 { margin: 0; font-size: 16px; font-weight: 900; color: #020617; }
    a { color: #4f46e5; font-size: 13px; font-weight: 800; }
    .panel-note { color: #64748b; font-size: 12px; font-weight: 800; }
    .chart-grid { display: grid; grid-template-columns: minmax(280px, 1.1fr) repeat(2, minmax(240px, 1fr)); gap: 16px; }
    .chart-panel { min-height: 246px; }
    .attendance-chart { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 18px; }
    .donut { width: 132px; height: 132px; display: grid; place-items: center; border-radius: 50%; position: relative; }
    .donut::after { content: ''; position: absolute; inset: 18px; border-radius: inherit; background: #fff; }
    .donut span { position: relative; z-index: 1; color: #020617; font-size: 24px; font-weight: 900; }
    .attendance-legend { display: grid; gap: 10px; color: #475569; font-size: 13px; font-weight: 800; }
    .attendance-legend div { display: flex; align-items: center; gap: 8px; }
    .attendance-legend strong { color: #020617; font-size: 15px; }
    .dot { width: 10px; height: 10px; border-radius: 999px; background: #cbd5e1; }
    .dot.present { background: #10b981; }
    .dot.absent { background: #ef4444; }
    .dot.muted { background: #94a3b8; }
    .recent-attendance { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
    .recent-attendance span { min-width: 44px; min-height: 30px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: #fef2f2; color: #b91c1c; font-size: 12px; font-weight: 900; }
    .recent-attendance span.present { background: #ecfdf5; color: #047857; }
    .bar-chart { display: grid; gap: 12px; }
    .bar-row { display: grid; grid-template-columns: 52px 1fr 28px; align-items: center; gap: 10px; color: #475569; font-size: 12px; font-weight: 900; }
    .bar-row div { height: 10px; overflow: hidden; border-radius: 999px; background: #eef2ff; }
    .bar-row i { display: block; height: 100%; min-width: 4px; border-radius: inherit; background: #4f46e5; }
    .bar-row.work div { background: #ecfeff; }
    .bar-row.work i { background: #0891b2; }
    .bar-row strong { color: #0f172a; text-align: right; }
    .student-row { display: flex; gap: 12px; padding: 12px 0; border-top: 1px solid #f1f5f9; }
    .student-row mat-icon { color: #64748b; }
    .student-row div { display: grid; gap: 2px; }
    .student-row strong { color: #0f172a; }
    .student-row span, .student-empty { color: #64748b; font-size: 13px; font-weight: 600; }
    .student-state { padding: 18px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; color: #64748b; font-weight: 800; }
    .student-state--error { border-color: #fecdd3; background: #fff1f2; color: #be123c; }
    :host-context(.dark) h1,
    :host-context(.dark) h2,
    :host-context(.dark) .student-card strong,
    :host-context(.dark) .donut span,
    :host-context(.dark) .attendance-legend strong,
    :host-context(.dark) .bar-row strong,
    :host-context(.dark) .student-row strong {
      color: #f8fafc;
    }
    :host-context(.dark) p,
    :host-context(.dark) .student-eyebrow,
    :host-context(.dark) .student-card span,
    :host-context(.dark) .panel-note,
    :host-context(.dark) .attendance-legend,
    :host-context(.dark) .bar-row,
    :host-context(.dark) .student-row span,
    :host-context(.dark) .student-empty,
    :host-context(.dark) .student-state {
      color: #94a3b8;
    }
    :host-context(.dark) .student-card,
    :host-context(.dark) .student-panel,
    :host-context(.dark) .student-state {
      border-color: #334155;
      background: #0f172a;
      box-shadow: none;
    }
    :host-context(.dark) .student-card:hover {
      border-color: #4f46e5;
      background: #111827;
    }
    :host-context(.dark) .donut::after {
      background: #0f172a;
    }
    :host-context(.dark) .bar-row div {
      background: #1e293b;
    }
    :host-context(.dark) .bar-row.work div {
      background: #0f2830;
    }
    :host-context(.dark) .student-row {
      border-color: #1e293b;
    }
    :host-context(.dark) .recent-attendance span {
      background: rgb(127 29 29 / .35);
      color: #fecdd3;
    }
    :host-context(.dark) .recent-attendance span.present {
      background: rgb(6 95 70 / .32);
      color: #6ee7b7;
    }
    :host-context(.dark) .student-state--error {
      border-color: #7f1d1d;
      background: #450a0a;
      color: #fecdd3;
    }
    @media (max-width: 1100px) { .chart-grid { grid-template-columns: 1fr; } }
    @media (max-width: 560px) {
      .attendance-chart { grid-template-columns: 1fr; }
      .donut { width: 116px; height: 116px; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentOverviewComponent implements OnInit {
  private readonly data = inject(StudentDashboardDataService);
  readonly dashboard = signal<StudentDashboard | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.dashboard.set(await firstValueFrom(this.data.overview()));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load student overview');
    } finally {
      this.loading.set(false);
    }
  }

  time(value: string | null | undefined): string {
    if (!value) return 'No time';
    const [h, m = '00'] = value.split(':');
    const hour = Number(h);
    if (Number.isNaN(hour)) return value;
    const period = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m.padStart(2, '0')} ${period}`;
  }

  date(value: string | null | undefined): string {
    if (!value) return 'No date';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  shortDay(value: string | null | undefined): string {
    if (!value) return '-';
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleDateString('en-US', { weekday: 'short' });
  }

  isPresent(status: string | null | undefined): boolean {
    return String(status ?? '').toLowerCase() === 'present';
  }

  attendanceDonut(data: StudentDashboard): string {
    const rate = Math.max(0, Math.min(100, data.attendance.attendanceRate || 0));
    return `conic-gradient(#10b981 0 ${rate}%, #ef4444 ${rate}% 100%)`;
  }

  scheduleBars(sessions: StudentScheduleSession[]): ChartBar[] {
    const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const counts = labels.map((label) => ({
      label: label.slice(0, 3),
      value: sessions.filter((session) => session.day?.toLowerCase() === label.toLowerCase()).length,
    }));
    return this.withPercent(counts);
  }

  workStatusBars(exams: StudentExam[]): ChartBar[] {
    const counts = exams.reduce<Record<string, number>>((acc, exam) => {
      const key = this.statusLabel(exam.status);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return this.withPercent(Object.entries(counts).map(([label, value]) => ({ label, value })));
  }

  private statusLabel(value: string | null | undefined): string {
    const normalized = String(value ?? 'Assigned').trim().replace(/[_-]+/g, ' ');
    return normalized ? normalized.replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Assigned';
  }

  private withPercent(values: Array<{ label: string; value: number }>): ChartBar[] {
    const max = Math.max(1, ...values.map((item) => item.value));
    return values.map((item) => ({ ...item, percent: item.value === 0 ? 0 : Math.max(8, Math.round((item.value / max) * 100)) }));
  }
}

interface ChartBar {
  label: string;
  value: number;
  percent: number;
}
