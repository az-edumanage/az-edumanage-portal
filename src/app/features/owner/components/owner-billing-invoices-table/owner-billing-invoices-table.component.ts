import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TABLE_COMPONENTS } from '../../../../shared/directives';
import { Invoice } from '../../models/owner-billing.models';

@Component({
  selector: 'app-owner-billing-invoices-table',
  imports: [CommonModule, RouterModule, MatIconModule, ...TABLE_COMPONENTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-billing-invoices-table.component.html',
  styleUrl: './owner-billing-invoices-table.component.css',
})
export class OwnerBillingInvoicesTableComponent {
  invoices = input.required<Invoice[]>();
  statusColorResolver = input<(status: string) => string>(() => '#64748b');

  copyValue = output<string>();
  viewProof = output<Invoice>();
  initiateRefund = output<Invoice>();
}
