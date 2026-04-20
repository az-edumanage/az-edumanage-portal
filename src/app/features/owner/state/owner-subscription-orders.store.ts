import { Injectable, signal } from '@angular/core';
import {
  SubscriptionOrder,
  SubscriptionOrderActionType,
  SubscriptionOrderExportFormat,
  SubscriptionOrderExportMode,
  SubscriptionOrderExportPdfType,
} from '../models/owner-subscription-orders.models';

@Injectable({ providedIn: 'root' })
export class OwnerSubscriptionOrdersStore {
  readonly searchQuery = signal('');
  readonly selectedStatus = signal('');
  readonly isStatusDropdownOpen = signal(false);
  readonly statusDropdownSearchQuery = signal('');

  readonly selectedOrderIds = signal<Set<string>>(new Set());

  readonly showAttachmentModal = signal(false);
  readonly currentAttachmentUrl = signal('');

  readonly showConfirmModal = signal(false);
  readonly orderToAction = signal<SubscriptionOrder | null>(null);
  readonly actionType = signal<SubscriptionOrderActionType>('approve');

  readonly showExportModal = signal(false);
  readonly exportStep = signal(1);
  readonly exportFormat = signal<SubscriptionOrderExportFormat | null>(null);
  readonly exportPdfType = signal<SubscriptionOrderExportPdfType>('rows');
  readonly exportDateFrom = signal('');
  readonly exportDateTo = signal('');
  readonly exportMode = signal<SubscriptionOrderExportMode>('all');

  readonly statuses: string[] = ['Pending', 'Approved', 'Paid', 'Rejected'];
}
