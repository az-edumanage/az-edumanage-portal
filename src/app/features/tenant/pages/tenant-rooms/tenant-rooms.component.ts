import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { TenantRoomsFacade } from '../../state/tenant-rooms.facade';
import { Room } from '../../models/tenant-rooms.models';

@Component({
  selector: 'app-tenant-rooms',
  imports: [CommonModule, MatIconModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-rooms.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantRoomsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TenantRoomsFacade);

  readonly searchQuery = this.facade.searchQuery;
  readonly showFilterPanel = this.facade.showFilterPanel;
  readonly viewMode = this.facade.viewMode;
  readonly rooms = this.facade.rooms;
  readonly activeFiltersCount = this.facade.activeFiltersCount;
  readonly filteredRooms = this.facade.filteredRooms;
  readonly pagedRooms = this.facade.pagedRooms;
  readonly totalFilteredRooms = this.facade.totalFilteredRooms;
  readonly totalPages = this.facade.totalPages;
  readonly pageIndex = this.facade.pageIndex;
  readonly pageSize = this.facade.pageSize;
  readonly pageStart = this.facade.pageStart;
  readonly pageEnd = this.facade.pageEnd;
  readonly deleteState = this.facade.deleteState;

  readonly filterForm = this.fb.group({
    type: [''],
    status: [''],
    sortBy: ['name'],
  });

  constructor() {
    this.facade.loadRooms();

    this.filterForm.valueChanges
      .pipe(startWith(this.filterForm.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.facade.setFilters(value.type ?? '', value.status ?? '', value.sortBy ?? 'name');
      });
  }

  toggleFilterPanel(): void {
    this.facade.toggleFilterPanel();
  }

  setSearchQuery(value: string): void {
    this.facade.setSearchQuery(value);
  }

  clearAllFilters(): void {
    this.facade.clearAllFilters();
    this.clearAdvancedFilters();
  }

  clearAdvancedFilters(): void {
    this.facade.clearAdvancedFilters();
    this.filterForm.reset({
      type: '',
      status: '',
      sortBy: 'name',
    });
  }

  previousPage(): void {
    this.facade.previousPage();
  }

  nextPage(): void {
    this.facade.nextPage();
  }

  setPageSize(value: string): void {
    this.facade.setPageSize(Number(value));
  }

  requestDelete(room: Room): void {
    this.facade.requestDelete(room);
  }

  closeDeleteModal(): void {
    this.facade.closeDeleteModal();
  }

  confirmDelete(): void {
    void this.facade.confirmDelete();
  }
}
