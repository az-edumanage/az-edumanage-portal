import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantCollegesFacade } from '../../state/tenant-colleges.facade';

@Component({
  selector: 'app-tenant-colleges',
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './tenant-colleges.component.html',
  styleUrl: './tenant-colleges.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantCollegesComponent implements OnInit {
  private readonly facade = inject(TenantCollegesFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly searchQuery = this.facade.searchQuery;
  readonly colleges = this.facade.filteredColleges;
  readonly allColleges = this.facade.colleges;
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;
  readonly deleteError = this.facade.deleteError;
  readonly deletingId = this.facade.deletingId;
  readonly viewMode = signal<'grid' | 'list'>('list');
  readonly showFilterPanel = signal(false);
  readonly universityFilter = this.facade.universityFilter;
  readonly universityOptions = this.facade.universityOptions;
  readonly optionsLoading = this.facade.optionsLoading;
  readonly activeFiltersCount = computed(() => (this.searchQuery().trim() ? 1 : 0) + (this.universityFilter() ? 1 : 0));

  ngOnInit(): void {
    const universityId = this.route.snapshot.queryParamMap.get('universityId') ?? '';
    if (universityId) {
      this.facade.setUniversityFilter(universityId);
      this.viewMode.set('list');
    }
    void this.facade.loadUniversityOptions();
    void this.facade.loadColleges();
  }

  onSearch(value: string): void {
    this.facade.setSearch(value);
  }

  toggleFilterPanel(): void {
    this.showFilterPanel.update((visible) => !visible);
  }

  onUniversityFilter(universityId: string): void {
    this.facade.setUniversityFilter(universityId);
  }

  clearAllFilters(): void {
    this.facade.setSearch('');
    this.facade.setUniversityFilter('');
  }

  clearAdvancedFilters(): void {
    this.facade.setUniversityFilter('');
  }

  deleteCollege(id: string): void {
    void this.facade.deleteCollege(id);
  }

  openRelatedSubjects(collegeId: string, universityId: string): void {
    void this.router.navigate(['/tenant/university-subjects'], {
      queryParams: {
        universityId,
        collegeId,
      },
    });
  }
}
