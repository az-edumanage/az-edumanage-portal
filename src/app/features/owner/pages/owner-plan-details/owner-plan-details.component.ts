import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { OwnerPlanDetailsFacade } from '../../state/owner-plan-details.facade';

@Component({
  selector: 'app-owner-plan-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './owner-plan-details.component.html'})
export class OwnerPlanDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(OwnerPlanDetailsFacade);

  readonly planId = this.facade.planId;
  readonly planName = this.facade.planName;
  readonly subscriptions = this.facade.subscriptions;
  readonly auditLogs = this.facade.auditLogs;
  readonly offers = this.facade.offers;
  readonly lastSubscription = this.facade.lastSubscription;

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.facade.setPlanId(params['id'] ?? null);
    });
  }
}
