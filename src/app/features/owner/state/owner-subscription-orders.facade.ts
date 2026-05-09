import { Injectable, computed, effect, inject } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { OwnerSubscriptionOrdersDataService } from '../data-access/owner-subscription-orders-data.service';
import { OwnerSubscriptionOrderStatusesDataService } from '../data-access/owner-subscription-order-statuses-data.service';
import {
  SubscriptionOrder,
  SubscriptionOrderActionType,
  SubscriptionOrderExportFormat,
  SubscriptionOrderExportMode,
} from '../models/owner-subscription-orders.models';
import { OwnerSubscriptionOrdersStore } from './owner-subscription-orders.store';

@Injectable({ providedIn: 'root' })
export class OwnerSubscriptionOrdersFacade {
  private readonly store = inject(OwnerSubscriptionOrdersStore);
  private readonly data = inject(OwnerSubscriptionOrdersDataService);
  private readonly orderStatusesData = inject(OwnerSubscriptionOrderStatusesDataService);
  private readonly dashboardService = inject(DashboardService);

  readonly orders = this.data.orders;
  readonly searchQuery = this.store.searchQuery;
  readonly selectedStatus = this.store.selectedStatus;
  readonly isStatusDropdownOpen = this.store.isStatusDropdownOpen;
  readonly statusDropdownSearchQuery = this.store.statusDropdownSearchQuery;

  readonly selectedOrderIds = this.store.selectedOrderIds;

  readonly showAttachmentModal = this.store.showAttachmentModal;
  readonly currentAttachmentUrl = this.store.currentAttachmentUrl;

  readonly showConfirmModal = this.store.showConfirmModal;
  readonly orderToAction = this.store.orderToAction;
  readonly actionType = this.store.actionType;

  readonly showExportModal = this.store.showExportModal;
  readonly exportStep = this.store.exportStep;
  readonly exportFormat = this.store.exportFormat;
  readonly exportPdfType = this.store.exportPdfType;
  readonly exportDateFrom = this.store.exportDateFrom;
  readonly exportDateTo = this.store.exportDateTo;
  readonly exportMode = this.store.exportMode;
  readonly statuses = this.orderStatusesData.statusNames;

  readonly filteredStatuses = computed(() => {
    const query = this.statusDropdownSearchQuery().toLowerCase();
    if (!query) {
      return this.statuses();
    }

    return this.statuses().filter((status) =>
      status.toLowerCase().includes(query),
    );
  });

  readonly pendingCount = computed(
    () => this.orders().filter((order) => order.status === 'Pending').length,
  );

  readonly paidCount = computed(
    () => this.orders().filter((order) => order.status === 'Paid').length,
  );

  readonly filteredOrders = computed(() => {
    let filtered = this.orders();

    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(
        (order) =>
          order.tenantName.toLowerCase().includes(query) ||
          order.id.toLowerCase().includes(query),
      );
    }

    const status = this.selectedStatus();
    if (status) {
      filtered = filtered.filter((order) => order.status === status);
    }

    return filtered;
  });

  readonly isAllSelected = computed(() => {
    const filtered = this.filteredOrders();
    return filtered.length > 0 && filtered.every((o) => this.selectedOrderIds().has(o.id));
  });

  constructor() {
    effect(() => {
      this.dashboardService.pendingSubscriptionOrdersCount.set(this.pendingCount());
    });
  }

  setSearchQuery(value: string): void {
    this.searchQuery.set(value);
  }

  toggleStatusDropdown(): void {
    this.isStatusDropdownOpen.update((value) => !value);
  }

  closeStatusDropdown(): void {
    this.isStatusDropdownOpen.set(false);
  }

  setStatusDropdownSearchQuery(value: string): void {
    this.statusDropdownSearchQuery.set(value);
  }

  selectStatus(status: string): void {
    this.selectedStatus.set(status);
    this.isStatusDropdownOpen.set(false);
    this.statusDropdownSearchQuery.set('');
  }

  toggleOrderSelection(id: string): void {
    this.selectedOrderIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  toggleAllSelection(): void {
    const filtered = this.filteredOrders();

    if (this.isAllSelected()) {
      this.selectedOrderIds.update((set) => {
        const next = new Set(set);
        filtered.forEach((order) => next.delete(order.id));
        return next;
      });
      return;
    }

    this.selectedOrderIds.update((set) => {
      const next = new Set(set);
      filtered.forEach((order) => next.add(order.id));
      return next;
    });
  }

  clearSelection(): void {
    this.selectedOrderIds.set(new Set());
  }

  openAttachment(url: string): void {
    this.currentAttachmentUrl.set(url);
    this.showAttachmentModal.set(true);
  }

  closeAttachment(): void {
    this.showAttachmentModal.set(false);
    this.currentAttachmentUrl.set('');
  }

  openConfirmModal(order: SubscriptionOrder, action: SubscriptionOrderActionType): void {
    this.orderToAction.set(order);
    this.actionType.set(action);
    this.showConfirmModal.set(true);
  }

  closeConfirmModal(): void {
    this.showConfirmModal.set(false);
    this.orderToAction.set(null);
  }

  processAction(): void {
    const order = this.orderToAction();
    const action = this.actionType();

    if (order) {
      const status = action === 'approve' ? 'Approved' : 'Rejected';
      this.data.updateOrderStatus(order.id, status);
    }

    this.closeConfirmModal();
  }

  openExportModal(): void {
    this.exportStep.set(1);
    this.exportFormat.set(null);
    this.exportPdfType.set('rows');
    this.exportDateFrom.set('');
    this.exportDateTo.set('');
    this.exportMode.set('all');
    this.showExportModal.set(true);
  }

  closeExportModal(): void {
    this.showExportModal.set(false);
  }

  selectExportFormat(format: SubscriptionOrderExportFormat): void {
    this.exportFormat.set(format);
  }

  setExportPdfType(value: 'details' | 'rows'): void {
    this.exportPdfType.set(value);
  }

  setExportDateFrom(value: string): void {
    this.exportDateFrom.set(value);
  }

  setExportDateTo(value: string): void {
    this.exportDateTo.set(value);
  }

  setExportMode(value: SubscriptionOrderExportMode): void {
    this.exportMode.set(value);
  }

  setExportStep(step: number): void {
    this.exportStep.set(step);
  }

  nextExportStep(): void {
    if (this.exportStep() === 1) {
      if (!this.exportFormat()) {
        return;
      }
      this.exportStep.set(2);
      return;
    }

    this.startExport();
  }

  startExport(): void {
    const format = this.exportFormat();
    if (!format) {
      return;
    }

    let dataToExport: SubscriptionOrder[] = [];
    const mode = this.exportMode();

    if (mode === 'all') {
      dataToExport = this.orders();
    } else if (mode === 'filtered') {
      dataToExport = this.filteredOrders();
    } else {
      const selectedIds = this.selectedOrderIds();
      dataToExport = this.orders().filter((order) => selectedIds.has(order.id));
    }

    const fromDate = this.exportDateFrom();
    const toDate = this.exportDateTo();

    if (fromDate || toDate) {
      dataToExport = dataToExport.filter((order) => {
        const orderDate = new Date(order.orderDate);
        if (fromDate && orderDate < new Date(fromDate)) {
          return false;
        }
        if (toDate && orderDate > new Date(toDate)) {
          return false;
        }
        return true;
      });
    }

    if (format === 'excel') {
      this.data.exportToExcel(dataToExport);
    } else if (this.exportPdfType() === 'details') {
      this.data.exportToPdfDetails(dataToExport);
    } else {
      this.data.exportToPdfRows(dataToExport);
    }

    this.closeExportModal();
  }
}
