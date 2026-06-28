import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EducationalStage } from '../../models/tenant-educational-stages.models';
import { TenantEducationalStagesFacade } from '../../state/tenant-educational-stages.facade';
import { EducationalStageSort } from '../../state/tenant-educational-stages.store';

@Component({
  selector: 'app-tenant-educational-stages',
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-educational-stages.component.html',
  styleUrl: './tenant-educational-stages.component.css',
})
export class TenantEducationalStagesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TenantEducationalStagesFacade);
  private readonly router = inject(Router);

  readonly searchQuery = this.facade.searchQuery;
  readonly showFilterPanel = this.facade.showFilterPanel;
  readonly stages = this.facade.stages;
  readonly activeFiltersCount = this.facade.activeFiltersCount;
  readonly filteredStages = this.facade.filteredStages;
  readonly countryOptions = this.facade.countryOptions;
  readonly loading = this.facade.loading;
  readonly countriesLoading = this.facade.countriesLoading;
  readonly saving = this.facade.saving;
  readonly deletingStageId = this.facade.deletingStageId;
  readonly loadError = this.facade.loadError;
  readonly countriesError = this.facade.countriesError;
  readonly saveError = this.facade.saveError;
  readonly deleteError = this.facade.deleteError;
  readonly showCreateModal = signal(false);
  readonly editingStage = signal<EducationalStage | null>(null);

  readonly filterForm = this.fb.group({
    country: [''],
    sortBy: ['order' as EducationalStageSort],
  });

  readonly createForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    description: [''],
    countryId: ['', [Validators.required]],
  });

  constructor() {
    this.filterForm.valueChanges
      .pipe(startWith(this.filterForm.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.facade.setFilters(
          value.country ?? '',
          value.sortBy ?? 'order',
        );
      });
  }

  ngOnInit(): void {
    void this.facade.loadStages();
    void this.facade.loadCountryOptions();
  }

  openStageGrades(stage: EducationalStage): void {
    void this.router.navigate(['/tenant/grades'], {
      queryParams: { stageId: stage.id },
    });
  }

  toggleFilterPanel(): void {
    this.facade.toggleFilterPanel();
  }

  clearAllFilters(): void {
    this.facade.clearAllFilters();
    this.clearAdvancedFilters();
  }

  clearAdvancedFilters(): void {
    this.facade.clearAdvancedFilters();
    this.filterForm.reset({
      country: '',
      sortBy: 'order',
    });
  }

  openCreateModal(): void {
    this.editingStage.set(null);
    this.createForm.reset({
      name: '',
      description: '',
      countryId: this.countryOptions()[0]?.value ?? '',
    });
    this.showCreateModal.set(true);
  }

  openEditModal(stage: EducationalStage): void {
    this.editingStage.set(stage);
    this.createForm.reset({
      name: stage.name,
      description: stage.description,
      countryId: stage.countryId,
    });
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.editingStage.set(null);
  }

  async saveStage(): Promise<void> {
    if (this.createForm.invalid || this.saving()) {
      this.createForm.markAllAsTouched();
      return;
    }

    const value = this.createForm.getRawValue();
    const editingStage = this.editingStage();

    if (editingStage) {
      const saved = await this.facade.updateStage(editingStage.id, value);
      if (!saved) {
        return;
      }
    } else {
      const saved = await this.facade.createStage(value);
      if (!saved) {
        return;
      }
    }

    this.closeCreateModal();
  }

  deleteStage(stageId: string): void {
    if (this.deletingStageId()) {
      return;
    }
    void this.facade.deleteStage(stageId);
  }
}
