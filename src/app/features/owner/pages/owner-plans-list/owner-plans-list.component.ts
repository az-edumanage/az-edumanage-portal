import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Plan } from '../../models/owner-plans.models';
import { OwnerPlansListFacade } from '../../state/owner-plans-list.facade';
import { TaskService } from '../../../../core/services/task.service';

@Component({
  selector: 'app-owner-plans-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-plans-list.component.html',
  styleUrl: './owner-plans-list.component.css'
})
export class OwnerPlansListComponent {
  private readonly facade = inject(OwnerPlansListFacade);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);

  readonly plans = this.facade.plans;

  ngOnInit(): void {
    void this.facade.refreshPlans();
  }

  calculateSavings(plan: Plan): number {
    return this.facade.calculateSavings(plan);
  }

  togglePlanStatus(plan: Plan): void {
    void this.facade.togglePlanStatus(plan);
  }

  startCreatePlan(): void {
    this.taskService.removeTask('create-plan-task');
    void this.router.navigate(['/owner/plans/create']);
  }
}
