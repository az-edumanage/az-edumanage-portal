import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantUniversitySubjectsFacade } from '../../state/tenant-university-subjects.facade';

@Component({
  selector: 'app-tenant-university-subjects',
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './tenant-university-subjects.component.html',
  styleUrl: './tenant-university-subjects.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantUniversitySubjectsComponent implements OnInit {
  private readonly facade = inject(TenantUniversitySubjectsFacade);
  private readonly route = inject(ActivatedRoute);

  readonly searchQuery = this.facade.searchQuery;
  readonly viewMode = this.facade.viewMode;
  readonly universityFilter = this.facade.universityFilter;
  readonly collegeFilter = this.facade.collegeFilter;
  readonly subjects = this.facade.filteredSubjects;
  readonly allSubjects = this.facade.subjects;
  readonly universityOptions = this.facade.universityOptions;
  readonly collegeOptions = this.facade.filteredCollegeOptions;
  readonly optionsLoading = this.facade.optionsLoading;
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;
  readonly deleteError = this.facade.deleteError;
  readonly deletingId = this.facade.deletingId;
  readonly showFilterPanel = signal(false);
  readonly activeFiltersCount = computed(() =>
    (this.searchQuery().trim() ? 1 : 0)
    + (this.universityFilter() ? 1 : 0)
    + (this.collegeFilter() ? 1 : 0)
  );

  ngOnInit(): void {
    const universityId = this.route.snapshot.queryParamMap.get('universityId') ?? '';
    const collegeId = this.route.snapshot.queryParamMap.get('collegeId') ?? '';

    if (universityId || collegeId) {
      this.viewMode.set('list');
      if (universityId) {
        this.facade.setUniversityFilter(universityId);
      }
      if (collegeId) {
        this.facade.setCollegeFilter(collegeId);
      }
    }

    void this.facade.loadOptions();
    void this.facade.loadSubjects();
  }

  onSearch(value: string): void {
    this.facade.setSearch(value);
  }

  onViewMode(mode: 'grid' | 'list'): void {
    this.facade.setViewMode(mode);
  }

  toggleFilterPanel(): void {
    this.showFilterPanel.update((visible) => !visible);
  }

  onUniversityFilter(value: string): void {
    this.facade.setUniversityFilter(value);
  }

  onCollegeFilter(value: string): void {
    this.facade.setCollegeFilter(value);
  }

  clearAllFilters(): void {
    this.facade.setSearch('');
    this.facade.setUniversityFilter('');
    this.facade.setCollegeFilter('');
  }

  clearAdvancedFilters(): void {
    this.facade.setUniversityFilter('');
    this.facade.setCollegeFilter('');
  }

  deleteSubject(id: string): void {
    void this.facade.deleteSubject(id);
  }

  openDetails(id: string): void {
    void this.facade.goToDetails(id);
  }
}
