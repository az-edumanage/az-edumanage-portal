import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ParentDashboardDataService } from '../../data-access/parent-dashboard-data.service';
import { ParentAttendance } from '../../models/parent-dashboard.models';

@Component({
  selector: 'app-parent-attendance',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <section class="page">
      <header><h1>Attendance</h1><p>Arrival time and attendance status for your linked students.</p></header>
      @if (loading()) { <div class="state">Loading attendance...</div> }
      @else if (error()) { <div class="state error">{{ error() }}</div> }
      @else {
        <div class="table">
          <div class="table-toolbar">
            <label class="search-field">
              <mat-icon>search</mat-icon>
              <input type="search" placeholder="Search attendance" [value]="searchTerm()" (input)="setSearchTerm($any($event.target).value)" />
            </label>
          </div>
          <table>
            <thead><tr><th>Student</th><th>Group</th><th>Session date</th><th>Arrival time</th><th>Status</th><th>Source</th></tr></thead>
            <tbody>
              @for (row of pagedRows(); track row.id) {
                <tr>
                  <td><strong>{{ row.studentName }}</strong></td>
                  <td>{{ row.groupName || '-' }}</td>
                  <td>{{ date(row.sessionDate) }}</td>
                  <td>{{ row.arrivalTime ? dateTime(row.arrivalTime) : '-' }}</td>
                  <td><span class="pill" [class.warn]="isAbsent(row.status)">{{ row.status || '-' }}</span></td>
                  <td>{{ row.source || '-' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty">{{ searchTerm() ? 'No attendance rows match your search.' : 'No attendance has been recorded yet.' }}</td></tr>
              }
            </tbody>
          </table>
          @if (filteredRows().length > 0) {
            <div class="pagination">
              <span>Showing {{ rangeStart() }}-{{ rangeEnd() }} of {{ filteredRows().length }}</span>
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
export class ParentAttendanceComponent implements OnInit {
  private readonly data = inject(ParentDashboardDataService);
  readonly rows = signal<ParentAttendance[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) return this.rows();
    return this.rows().filter((row) => [
      row.studentName,
      row.groupName,
      row.sessionDate,
      row.arrivalTime,
      row.status,
      row.source,
    ].join(' ').toLowerCase().includes(query));
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredRows().length / this.pageSize())));
  readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });
  readonly rangeStart = computed(() => this.filteredRows().length === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  readonly rangeEnd = computed(() => Math.min(this.filteredRows().length, this.page() * this.pageSize()));

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.loading.set(true); this.error.set(null);
    try { this.rows.set(await firstValueFrom(this.data.attendance())); this.page.set(1); }
    catch (error) { this.error.set(error instanceof Error ? error.message : 'Unable to load attendance'); }
    finally { this.loading.set(false); }
  }

  setSearchTerm(value: string): void { this.searchTerm.set(value); this.page.set(1); }
  setPageSize(value: string): void { const size = Number(value); this.pageSize.set(Number.isNaN(size) ? 10 : size); this.page.set(1); }
  previousPage(): void { this.page.update((page) => Math.max(1, page - 1)); }
  nextPage(): void { this.page.update((page) => Math.min(this.totalPages(), page + 1)); }
  isAbsent(status: string | null | undefined): boolean { return String(status ?? '').toLowerCase() === 'absent'; }
  date(value: string | null | undefined): string { return value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'; }
  dateTime(value: string): string { return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
}
