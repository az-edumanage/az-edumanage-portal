import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantUniversitiesDataService } from '../../data-access/tenant-universities-data.service';
import { TenantUniversity } from '../../models/tenant-universities.models';

@Component({
  selector: 'app-tenant-questions-bank-university-colleges',
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  template: `
    <div class="tenant-universities-page">
      <nav class="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <a routerLink="/tenant/questions-bank" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">Questions Bank</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <span class="font-semibold text-slate-900 dark:text-slate-100">University Education</span>
      </nav>

      <div class="tenant-universities-header">
        <div>
          <h2 class="tenant-universities-title">Universities</h2>
          <p class="tenant-universities-subtitle">Choose a university before browsing colleges and question bank subjects.</p>
        </div>
      </div>

      <div class="tenant-universities-filter-shell">
        <div class="tenant-universities-filter-row">
          <div class="tenant-universities-search">
            <mat-icon class="tenant-universities-search-icon">search</mat-icon>
            <input
              type="search"
              [ngModel]="searchQuery()"
              (ngModelChange)="onSearch($event)"
              placeholder="Search universities by name or description..."
              class="tenant-universities-search-input"
            >
          </div>

          <div class="tenant-universities-filter-actions">
            <div class="relative">
              <button
                type="button"
                (click)="toggleFilterPanel()"
                [class.bg-indigo-600/10]="showFilterPanel() || activeFiltersCount() > 0"
                [class.text-indigo-600]="showFilterPanel() || activeFiltersCount() > 0"
                [class.border-indigo-200]="showFilterPanel() || activeFiltersCount() > 0"
                class="tenant-universities-advanced-filter-btn"
              >
                <mat-icon class="text-sm">filter_list</mat-icon>
                Filters
                @if (activeFiltersCount() > 0) {
                  <span class="tenant-universities-filter-count">{{ activeFiltersCount() }}</span>
                }
                <mat-icon class="text-xs transition-transform duration-200" [class.rotate-180]="showFilterPanel()">expand_more</mat-icon>
              </button>

              @if (showFilterPanel()) {
                <div class="tenant-universities-filter-dropdown">
                  <div class="tenant-universities-filter-dropdown-head">
                    <h3 class="tenant-universities-filter-dropdown-title">Filter Options</h3>
                    <button type="button" (click)="clearAdvancedFilters()" class="tenant-universities-filter-reset">Reset</button>
                  </div>

                  <div class="tenant-universities-filter-fields">
                    <div>
                      <label for="question-bank-university-sort-filter" class="tenant-universities-filter-label">Sort By</label>
                      <select
                        id="question-bank-university-sort-filter"
                        [ngModel]="sortFilter()"
                        (ngModelChange)="onSortFilter($event)"
                        class="tenant-universities-filter-select"
                      >
                        <option value="order">University Order</option>
                        <option value="name">Name (A-Z)</option>
                        <option value="colleges-desc">Colleges (High to Low)</option>
                        <option value="subjects-desc">Subjects (High to Low)</option>
                      </select>
                    </div>
                  </div>

                  <div class="tenant-universities-filter-apply-wrap">
                    <button type="button" (click)="toggleFilterPanel()" class="tenant-universities-filter-apply">Apply Filters</button>
                  </div>
                </div>
              }
            </div>

            @if (activeFiltersCount() > 0 || searchQuery()) {
              <button type="button" (click)="clearAllFilters()" class="tenant-universities-reset-all">
                <mat-icon class="text-sm">restart_alt</mat-icon>
                Reset All
              </button>
            }
          </div>
        </div>
      </div>

      @if (loadError()) {
        <div class="tenant-universities-empty">
          <div class="tenant-universities-empty-icon-wrap">
            <mat-icon class="text-slate-500">error</mat-icon>
          </div>
          <h3 class="tenant-universities-empty-title">Unable to load universities</h3>
          <p class="tenant-universities-empty-text">{{ loadError() }}</p>
        </div>
      } @else if (loading()) {
        <div class="tenant-universities-empty">
          <div class="tenant-universities-empty-icon-wrap">
            <mat-icon class="text-slate-500">hourglass_empty</mat-icon>
          </div>
          <h3 class="tenant-universities-empty-title">Loading universities</h3>
          <p class="tenant-universities-empty-text">Please wait while universities load.</p>
        </div>
      } @else if (universities().length > 0) {
        <div class="tenant-universities-table-shell">
          <div class="tenant-universities-table-scroll">
            <table class="tenant-universities-table">
              <thead class="tenant-universities-table-head">
                <tr>
                  <th class="tenant-universities-th">University Name</th>
                  <th class="tenant-universities-th">Country</th>
                  <th class="tenant-universities-th tenant-universities-th--center">Colleges</th>
                  <th class="tenant-universities-th tenant-universities-th--center">Subjects</th>
                  <th class="tenant-universities-th tenant-universities-th--actions">Actions</th>
                </tr>
              </thead>
              <tbody class="tenant-universities-tbody">
                @for (university of universities(); track university.id) {
                  <tr
                    class="tenant-universities-tr cursor-pointer"
                    role="link"
                    tabindex="0"
                    [attr.aria-label]="'Open colleges for ' + university.name"
                    (click)="openUniversityColleges(university.id)"
                    (keydown.enter)="openUniversityColleges(university.id)"
                    (keydown.space)="openUniversityColleges(university.id); $event.preventDefault()"
                  >
                    <td class="tenant-universities-td">
                      <div class="tenant-universities-row-name-wrap">
                        <div class="tenant-universities-row-icon-wrap">
                          <mat-icon class="text-sm block">account_balance</mat-icon>
                        </div>
                        <div>
                          <span class="tenant-universities-row-name">{{ university.name }}</span>
                          <p class="tenant-universities-row-description">{{ university.description || 'No description' }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="tenant-universities-td">
                      <span class="tenant-universities-country">{{ university.countryName || '-' }}</span>
                    </td>
                    <td class="tenant-universities-td tenant-universities-td--center">
                      <div class="tenant-universities-count">
                        <mat-icon class="text-xs">apartment</mat-icon>
                        <span>{{ university.collegeCount }}</span>
                      </div>
                    </td>
                    <td class="tenant-universities-td tenant-universities-td--center">
                      <div class="tenant-universities-count">
                        <mat-icon class="text-xs">menu_book</mat-icon>
                        <span>{{ university.subjectCount }}</span>
                      </div>
                    </td>
                    <td class="tenant-universities-td tenant-universities-td--actions">
                      <div class="tenant-universities-row-actions">
                        <a [routerLink]="universityQuestionBankLink(university)" (click)="$event.stopPropagation()" class="tenant-universities-row-btn tenant-universities-row-btn--view" title="View colleges">
                          <mat-icon class="text-sm block">visibility</mat-icon>
                        </a>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      } @else {
        <div class="tenant-universities-empty">
          <div class="tenant-universities-empty-icon-wrap">
            <mat-icon class="text-slate-500">search_off</mat-icon>
          </div>
          <h3 class="tenant-universities-empty-title">No universities found</h3>
          <p class="tenant-universities-empty-text">
            {{ activeFiltersCount() === 0 ? 'No universities have been created yet.' : 'No universities match the current filters.' }}
          </p>
          @if (activeFiltersCount() > 0) {
            <button type="button" (click)="clearAllFilters()" class="tenant-universities-empty-btn">Clear All Filters</button>
          }
        </div>
      }
    </div>
  `,
  styleUrl: '../tenant-universities/tenant-universities.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantQuestionsBankUniversityCollegesComponent implements OnInit, OnDestroy {
  private readonly universitiesData = inject(TenantUniversitiesDataService);
  private readonly router = inject(Router);
  private searchLoadTimer: ReturnType<typeof setTimeout> | null = null;

  readonly searchQuery = signal('');
  readonly countryFilter = signal('');
  readonly sortFilter = signal<'order' | 'name' | 'colleges-desc' | 'subjects-desc'>('order');
  readonly countryOptions = signal<{ id: string; name: string }[]>([]);
  readonly optionsLoading = signal(false);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly isCreateModalOpen = signal(false);
  readonly statusModal = signal<{ title: string; message: string; icon: string } | null>(null);
  readonly showFilterPanel = signal(false);
  readonly universities = signal<TenantUniversity[]>([]);
  readonly activeFiltersCount = computed(() => (this.searchQuery().trim() ? 1 : 0) + (this.sortFilter() !== 'order' ? 1 : 0));

  ngOnInit(): void {
    void this.loadUniversities();
  }

  ngOnDestroy(): void {
    if (this.searchLoadTimer) {
      clearTimeout(this.searchLoadTimer);
    }
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.scheduleFilteredLoad();
  }

  toggleFilterPanel(): void {
    this.showFilterPanel.update((visible) => !visible);
  }

  onCountryFilter(countryId: string): void {
    this.countryFilter.set(countryId);
    void this.loadUniversities();
  }

  onSortFilter(sort: string): void {
    this.sortFilter.set((sort || 'order') as 'order' | 'name' | 'colleges-desc' | 'subjects-desc');
    this.sortUniversities();
  }

  clearAllFilters(): void {
    this.searchQuery.set('');
    this.countryFilter.set('');
    this.sortFilter.set('order');
    void this.loadUniversities();
  }

  clearAdvancedFilters(): void {
    this.countryFilter.set('');
    this.sortFilter.set('order');
    void this.loadUniversities();
  }

  openCreateModal(): void {
    this.statusModal.set(null);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  handleUniversitySaved(): void {
    this.closeCreateModal();
  }

  closeStatusModal(): void {
    this.statusModal.set(null);
  }

  deleteUniversity(_id: string): void {
    this.deleteError.set(null);
  }

  universityQuestionBankLink(university: TenantUniversity): unknown[] {
    return ['/tenant/questions-bank/university-education/universities', university.id];
  }

  openUniversityColleges(universityId: string): void {
    void this.router.navigate(['/tenant/questions-bank/university-education/universities', universityId]);
  }

  private async loadUniversities(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      this.universities.set(await this.universitiesData.listUniversities({ search: this.searchQuery() }));
      this.sortUniversities();
    } catch (error) {
      this.loadError.set(this.universitiesData.toUserMessage(error, 'Unable to load universities. Please try again.'));
    } finally {
      this.loading.set(false);
    }
  }

  private scheduleFilteredLoad(): void {
    if (this.searchLoadTimer) {
      clearTimeout(this.searchLoadTimer);
    }

    this.searchLoadTimer = setTimeout(() => {
      this.searchLoadTimer = null;
      void this.loadUniversities();
    }, 250);
  }

  private sortUniversities(): void {
    const sort = this.sortFilter();
    this.universities.update((universities) => [...universities].sort((left, right) => {
      if (sort === 'name') {
        return left.name.localeCompare(right.name);
      }
      if (sort === 'colleges-desc') {
        return right.collegeCount - left.collegeCount || left.name.localeCompare(right.name);
      }
      if (sort === 'subjects-desc') {
        return right.subjectCount - left.subjectCount || left.name.localeCompare(right.name);
      }
      return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
    }));
  }
}
