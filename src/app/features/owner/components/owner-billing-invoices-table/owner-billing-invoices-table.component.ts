import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BadgeComponent } from '../../../../shared/components/data-display/badge/badge.component';
import { TABLE_COMPONENTS } from '../../../../shared/components/data-display/table/table.components';
import { Invoice } from '../../owner-billing/models/owner-billing.models';

@Component({
  selector: 'app-owner-billing-invoices-table',
  imports: [CommonModule, RouterModule, MatIconModule, BadgeComponent, ...TABLE_COMPONENTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-billing-invoices-table.component.html',
  styleUrl: './owner-billing-invoices-table.component.css',
})
export class OwnerBillingInvoicesTableComponent {
  invoices = input.required<Invoice[]>();

  copyValue = output<string>();
  viewProof = output<Invoice>();
  initiateRefund = output<Invoice>();
}
