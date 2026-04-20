import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { SubscriptionOrder, SubscriptionOrderActionType, SubscriptionOrderExportFormat } from '../models/owner-subscription-orders.models';
import { OwnerSubscriptionOrdersFacade } from '../state/owner-subscription-orders.facade';

@Component({
  selector: 'app-owner-subscription-orders-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-subscription-orders-list.component.html'})
export class OwnerSubscriptionOrdersListComponent {
  private readonly facade = inject(OwnerSubscriptionOrdersFacade);

  readonly orders = this.facade.orders;
  readonly pendingCount = this.facade.pendingCount;
  readonly paidCount = this.facade.paidCount;

  readonly searchQuery = this.facade.searchQuery;
  readonly selectedStatus = this.facade.selectedStatus;
  readonly filteredOrders = this.facade.filteredOrders;

  readonly isDropdownOpen = this.facade.isStatusDropdownOpen;
  readonly filteredStatuses = this.facade.filteredStatuses;
  readonly statuses = this.facade.statuses;

  readonly selectedOrderIds = this.facade.selectedOrderIds;
  readonly isAllSelected = this.facade.isAllSelected;

  readonly showAttachmentModal = this.facade.showAttachmentModal;
  readonly currentAttachmentUrl = this.facade.currentAttachmentUrl;

  readonly showConfirmModal = this.facade.showConfirmModal;
  readonly orderToAction = this.facade.orderToAction;
  readonly actionType = this.facade.actionType;

  readonly showExportModal = this.facade.showExportModal;
  readonly exportStep = this.facade.exportStep;
  readonly exportFormat = this.facade.exportFormat;
  readonly exportPdfType = this.facade.exportPdfType;
  readonly exportDateFrom = this.facade.exportDateFrom;
  readonly exportDateTo = this.facade.exportDateTo;
  readonly exportMode = this.facade.exportMode;

  get dropdownSearchQuery(): string {
    return this.facade.statusDropdownSearchQuery();
  }

  set dropdownSearchQuery(value: string) {
    this.facade.setStatusDropdownSearchQuery(value);
  }

  toggleOrderSelection(id: string): void {
    this.facade.toggleOrderSelection(id);
  }

  toggleAllSelection(): void {
    this.facade.toggleAllSelection();
  }

  clearSelection(): void {
    this.facade.clearSelection();
  }

  viewAttachment(url: string, event: Event): void {
    event.stopPropagation();
    this.facade.openAttachment(url);
  }

  closeAttachmentModal(): void {
    this.facade.closeAttachment();
  }

  openConfirmModal(order: SubscriptionOrder, type: SubscriptionOrderActionType, event: Event): void {
    event.stopPropagation();
    this.facade.openConfirmModal(order, type);
  }

  closeConfirmModal(): void {
    this.facade.closeConfirmModal();
  }

  processAction(): void {
    this.facade.processAction();
  }

  openExportModal(): void {
    this.facade.openExportModal();
  }

  closeExportModal(): void {
    this.facade.closeExportModal();
  }

  selectExportFormat(format: SubscriptionOrderExportFormat): void {
    this.facade.selectExportFormat(format);
  }

  nextExportStep(): void {
    this.facade.nextExportStep();
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.facade.toggleStatusDropdown();
  }

  selectStatus(status: string): void {
    this.facade.selectStatus(status);
  }

  @HostListener('document:click')
  closeDropdown(): void {
    this.facade.closeStatusDropdown();
  }
}
