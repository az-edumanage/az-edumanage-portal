import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../../shared/components/data-display/badge/badge.component';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { TABLE_COMPONENTS } from '../../../shared/components/data-display/table/table.components';
import { Tab, Invoice } from './models/owner-billing.models';
import { OwnerBillingService } from './services/owner-billing.service';

@Component({
  selector: 'app-owner-billing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ButtonComponent, BadgeComponent, CardComponent, ...TABLE_COMPONENTS],
  templateUrl: './owner-billing.component.html'
})
export class OwnerBillingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private billingService = inject(OwnerBillingService);

  // --- UI State directly managed by component ---
  activeTab = signal<Tab>('invoices');
  showAdvancedFilters = signal<boolean>(false);
  
  // Modals specific to UI
  showProofModal = signal<boolean>(false);
  selectedInvoice = signal<Invoice | null>(null);

  showRefundModal = signal<boolean>(false);
  invoiceToRefund = signal<Invoice | null>(null);

  // --- Facade State Bindings ---
  tenantFilter = this.billingService.tenantFilter;
  searchQuery = this.billingService.searchQuery;
  filterStatus = this.billingService.filterStatus;
  filterMinAmount = this.billingService.filterMinAmount;
  filterMaxAmount = this.billingService.filterMaxAmount;

  isFiltered = this.billingService.isFiltered;
  maxRevenue = this.billingService.maxRevenue;
  
  monthlyReports = this.billingService.monthlyReports;
  filteredInvoices = this.billingService.filteredInvoices;
  filteredPayments = this.billingService.filteredPayments;
  filteredFailedPayments = this.billingService.filteredFailedPayments;
  filteredRefunds = this.billingService.filteredRefunds;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tenant']) {
        this.billingService.setTenantFilter(params['tenant']);
      }
    });
  }

  // --- Actions ---
  resetFilters() {
    this.billingService.resetFilters();
  }

  generateReport() {
    this.billingService.generateReport();
  }

  viewProof(invoice: Invoice) {
    this.selectedInvoice.set(invoice);
    this.showProofModal.set(true);
  }

  confirmPayment() {
    const inv = this.selectedInvoice();
    if (inv) {
      this.billingService.confirmPayment(inv.id);
    }
    this.showProofModal.set(false);
    this.selectedInvoice.set(null);
  }

  rejectProof() {
    this.showProofModal.set(false);
    this.selectedInvoice.set(null);
  }

  initiateRefund(invoice: Invoice) {
    this.invoiceToRefund.set(invoice);
    this.showRefundModal.set(true);
  }

  confirmRefund() {
    const invoice = this.invoiceToRefund();
    if (invoice) {
      this.billingService.processRefund(invoice);
    }
    this.showRefundModal.set(false);
    this.invoiceToRefund.set(null);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard:', text);
    });
  }
}
