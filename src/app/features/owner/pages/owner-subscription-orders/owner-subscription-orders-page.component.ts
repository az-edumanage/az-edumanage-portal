import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { OwnerSubscriptionOrdersFacade } from '../../state/owner-subscription-orders.facade';
import { OwnerSubscriptionOrdersFilterComponent } from '../../components/owner-subscription-orders-filter/owner-subscription-orders-filter.component';
import { OwnerSubscriptionOrdersTableComponent } from '../../components/owner-subscription-orders-table/owner-subscription-orders-table.component';
import { OwnerSubscriptionOrdersAttachmentModalComponent } from '../../components/owner-subscription-orders-attachment-modal/owner-subscription-orders-attachment-modal.component';
import { OwnerSubscriptionOrdersExportModalComponent } from '../../components/owner-subscription-orders-export-modal/owner-subscription-orders-export-modal.component';
import { OwnerSubscriptionOrdersConfirmModalComponent } from '../../components/owner-subscription-orders-confirm-modal/owner-subscription-orders-confirm-modal.component';

@Component({
  selector: 'app-owner-subscription-orders-page',
  imports: [
    CommonModule,
    MatIconModule,
    OwnerSubscriptionOrdersFilterComponent,
    OwnerSubscriptionOrdersTableComponent,
    OwnerSubscriptionOrdersAttachmentModalComponent,
    OwnerSubscriptionOrdersExportModalComponent,
    OwnerSubscriptionOrdersConfirmModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-subscription-orders-page.component.html',
  styleUrl: './owner-subscription-orders-page.component.css',
})
export class OwnerSubscriptionOrdersPageComponent {
  private readonly facade = inject(OwnerSubscriptionOrdersFacade);

  readonly orders = this.facade.orders;
  readonly pendingCount = this.facade.pendingCount;
  readonly paidCount = this.facade.paidCount;

  readonly searchQuery = this.facade.searchQuery;
  readonly selectedStatus = this.facade.selectedStatus;
  readonly isStatusDropdownOpen = this.facade.isStatusDropdownOpen;
  readonly statusDropdownSearchQuery = this.facade.statusDropdownSearchQuery;
  readonly filteredStatuses = this.facade.filteredStatuses;

  readonly filteredOrders = this.facade.filteredOrders;
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

  setSearchQuery(value: string): void {
    this.facade.setSearchQuery(value);
  }

  toggleStatusDropdown(): void {
    this.facade.toggleStatusDropdown();
  }

  closeStatusDropdown(): void {
    this.facade.closeStatusDropdown();
  }

  setStatusDropdownSearchQuery(value: string): void {
    this.facade.setStatusDropdownSearchQuery(value);
  }

  selectStatus(status: string): void {
    this.facade.selectStatus(status);
  }

  toggleAllSelection(): void {
    this.facade.toggleAllSelection();
  }

  toggleOrderSelection(id: string): void {
    this.facade.toggleOrderSelection(id);
  }

  clearSelection(): void {
    this.facade.clearSelection();
  }

  viewAttachment(url: string): void {
    this.facade.openAttachment(url);
  }

  closeAttachmentModal(): void {
    this.facade.closeAttachment();
  }

  openApproveModal(order: Parameters<OwnerSubscriptionOrdersFacade['openConfirmModal']>[0]): void {
    this.facade.openConfirmModal(order, 'approve');
  }

  openRejectModal(order: Parameters<OwnerSubscriptionOrdersFacade['openConfirmModal']>[0]): void {
    this.facade.openConfirmModal(order, 'reject');
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

  selectExportFormat(format: 'excel' | 'pdf'): void {
    this.facade.selectExportFormat(format);
  }

  setExportPdfType(value: 'details' | 'rows'): void {
    this.facade.setExportPdfType(value);
  }

  setExportDateFrom(value: string): void {
    this.facade.setExportDateFrom(value);
  }

  setExportDateTo(value: string): void {
    this.facade.setExportDateTo(value);
  }

  setExportMode(value: 'all' | 'page' | 'filtered'): void {
    this.facade.setExportMode(value);
  }

  setExportStep(step: number): void {
    this.facade.setExportStep(step);
  }

  nextExportStep(): void {
    this.facade.nextExportStep();
  }
}
