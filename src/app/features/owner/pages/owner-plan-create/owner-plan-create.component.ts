import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OwnerPlanCreateFacade } from '../../state/owner-plan-create.facade';
import { FORM_COMPONENTS } from '../../../../shared/components/form';

@Component({
  selector: 'app-owner-plan-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule, ...FORM_COMPONENTS],
  templateUrl: './owner-plan-create.component.html',
  styleUrl: './owner-plan-create.component.css'})
export class OwnerPlanCreateComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(OwnerPlanCreateFacade);

  readonly isEditMode = this.facade.isEditMode;
  readonly planId = this.facade.planId;

  readonly showStatusDropdown = this.facade.showStatusDropdown;
  readonly statusSearchQuery = this.facade.statusSearchQuery;
  readonly statuses = this.facade.statuses;
  readonly filteredStatuses = this.facade.filteredStatuses;

  readonly showVisibilityDropdown = this.facade.showVisibilityDropdown;
  readonly visibilitySearchQuery = this.facade.visibilitySearchQuery;
  readonly visibilities = this.facade.visibilities;
  readonly filteredVisibilities = this.facade.filteredVisibilities;

  readonly showCurrencyDropdown = this.facade.showCurrencyDropdown;
  readonly currencySearchQuery = this.facade.currencySearchQuery;
  readonly currencies = this.facade.currencies;
  readonly filteredCurrencies = this.facade.filteredCurrencies;

  readonly existingPlans = this.facade.existingPlans;
  readonly moduleOptions = this.facade.moduleOptions;
  readonly planForm = this.facade.planForm;
  readonly isSubmitting = this.facade.isSubmitting;
  readonly actionStatus = this.facade.actionStatus;

  ngOnInit(): void {
    void this.facade.initialize(this.route.snapshot.params['id'] ?? null);
  }

  ngOnDestroy(): void {
    this.facade.onDestroy();
  }

  onCancel(): void {
    this.facade.onCancel();
  }

  selectStatus(status: string): void {
    this.facade.selectStatus(status);
  }

  selectVisibility(visibility: string): void {
    this.facade.selectVisibility(visibility);
  }

  selectCurrency(currency: string): void {
    this.facade.selectCurrency(currency);
  }

  onSubmit(): void {
    this.facade.onSubmit();
  }

  isModuleSelected(moduleId: string): boolean {
    return this.facade.isModuleSelected(moduleId);
  }

  toggleModule(moduleId: string): void {
    this.facade.toggleModule(moduleId);
  }

  closeActionStatus(): void {
    this.facade.closeActionStatus();
  }
}
