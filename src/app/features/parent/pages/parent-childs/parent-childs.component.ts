import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ParentDashboardDataService } from '../../data-access/parent-dashboard-data.service';
import { ParentChild } from '../../models/parent-dashboard.models';

@Component({
  selector: 'app-parent-childs',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <section class="page">
      <header><h1>Childs</h1><p>Students linked to your parent account.</p></header>
      @if (loading()) { <div class="state">Loading childs...</div> }
      @else if (error()) { <div class="state error">{{ error() }}</div> }
      @else {
        <div class="table">
          <div class="table-toolbar">
            <label class="search-field">
              <mat-icon>search</mat-icon>
              <input type="search" placeholder="Search childs" [value]="searchTerm()" (input)="setSearchTerm($any($event.target).value)" />
            </label>
          </div>
          <table>
            <thead><tr><th>Student</th><th>Barcode</th><th>Contact</th><th>Gender</th><th>Birth date</th></tr></thead>
            <tbody>
              @for (child of pagedChildren(); track child.id) {
                <tr>
                  <td><strong>{{ child.name }}</strong></td>
                  <td>{{ child.barcodeNumber || '-' }}</td>
                  <td>{{ child.email || '-' }}<span>{{ child.phone || '-' }}</span></td>
                  <td>{{ child.gender || '-' }}</td>
                  <td>{{ child.birthDate || '-' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty">{{ searchTerm() ? 'No childs match your search.' : 'No linked childs found.' }}</td></tr>
              }
            </tbody>
          </table>
          @if (filteredChildren().length > 0) {
            <div class="pagination">
              <span>Showing {{ rangeStart() }}-{{ rangeEnd() }} of {{ filteredChildren().length }}</span>
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
export class ParentChildsComponent implements OnInit {
  private readonly data = inject(ParentDashboardDataService);
  readonly children = signal<ParentChild[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly filteredChildren = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) return this.children();
    return this.children().filter((child) => [
      child.name,
      child.email,
      child.phone,
      child.barcodeNumber,
      child.gender,
      child.birthDate,
    ].join(' ').toLowerCase().includes(query));
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredChildren().length / this.pageSize())));
  readonly pagedChildren = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredChildren().slice(start, start + this.pageSize());
  });
  readonly rangeStart = computed(() => this.filteredChildren().length === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  readonly rangeEnd = computed(() => Math.min(this.filteredChildren().length, this.page() * this.pageSize()));

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try { this.children.set(await firstValueFrom(this.data.children())); this.page.set(1); }
    catch (error) { this.error.set(error instanceof Error ? error.message : 'Unable to load childs'); }
    finally { this.loading.set(false); }
  }

  setSearchTerm(value: string): void { this.searchTerm.set(value); this.page.set(1); }
  setPageSize(value: string): void { const size = Number(value); this.pageSize.set(Number.isNaN(size) ? 10 : size); this.page.set(1); }
  previousPage(): void { this.page.update((page) => Math.max(1, page - 1)); }
  nextPage(): void { this.page.update((page) => Math.min(this.totalPages(), page + 1)); }
}
