import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TABLE_COMPONENTS } from '../../../../shared/directives';
import { Payment } from '../../models/owner-billing.models';

@Component({
  selector: 'app-owner-billing-payments-table',
  imports: [CommonModule, RouterModule, MatIconModule, ...TABLE_COMPONENTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-billing-payments-table.component.html',
  styleUrl: './owner-billing-payments-table.component.css',
})
export class OwnerBillingPaymentsTableComponent {
  payments = input.required<Payment[]>();
  copyValue = output<string>();
}
