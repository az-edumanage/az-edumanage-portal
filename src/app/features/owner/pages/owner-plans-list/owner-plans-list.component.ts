import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Plan } from '../../models/owner-plans.models';
import { OwnerPlansListFacade } from '../../state/owner-plans-list.facade';

@Component({
  selector: 'app-owner-plans-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-plans-list.component.html',
  styleUrl: './owner-plans-list.component.css'
})
export class OwnerPlansListComponent {
  private readonly facade = inject(OwnerPlansListFacade);

  readonly plans = this.facade.plans;

  calculateSavings(plan: Plan): number {
    return this.facade.calculateSavings(plan);
  }

  togglePlanStatus(plan: Plan): void {
    this.facade.togglePlanStatus(plan);
  }
}
