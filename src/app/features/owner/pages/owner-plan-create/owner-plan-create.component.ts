import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OwnerPlanCreateFacade } from '../../state/owner-plan-create.facade';

@Component({
  selector: 'app-owner-plan-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './owner-plan-create.component.html'})
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
  readonly planForm = this.facade.planForm;

  ngOnInit(): void {
    this.facade.initialize(this.route.snapshot.params['id'] ?? null);
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
}
