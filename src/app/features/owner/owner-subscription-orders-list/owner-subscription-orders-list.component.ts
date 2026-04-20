import { Component, signal, computed, HostListener, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DashboardService } from '../../../core/services/dashboard.service';

interface SubscriptionOrder {
  id: string;
  tenantName: string;
  templateName: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  paymentMethod: string;
  orderDate: string;
  attachmentUrl?: string;
}

@Component({
  selector: 'app-owner-subscription-orders-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-subscription-orders-list.component.html'})
export class OwnerSubscriptionOrdersListComponent {
  private router = inject(Router);
  private dashboardService = inject(DashboardService);

  orders = signal<SubscriptionOrder[]>([
    {
      id: 'ORD_1001',
      tenantName: 'Bright Future Academy',
      templateName: 'Standard Annual Contract',
      amount: 4500,
      status: 'Pending',
      paymentMethod: 'Bank Transfer',
      orderDate: 'Apr 10, 2024',
      attachmentUrl: 'https://picsum.photos/seed/receipt1/800/1200'
    },
    {
      id: 'ORD_1002',
      tenantName: 'Cairo Math Center',
      templateName: 'Monthly Flexible Plan',
      amount: 149,
      status: 'Paid',
      paymentMethod: 'InstaPay',
      orderDate: 'Apr 08, 2024'
    },
    {
      id: 'ORD_1003',
      tenantName: 'Elite Tutors',
      templateName: 'Semester Academic Pack',
      amount: 800,
      status: 'Approved',
      paymentMethod: 'Wallet Transfer',
      orderDate: 'Apr 05, 2024',
      attachmentUrl: 'https://picsum.photos/seed/receipt2/800/1200'
    }
  ]);

  constructor() {
    effect(() => {
      const count = this.orders().filter(o => o.status === 'Pending').length;
      this.dashboardService.pendingSubscriptionOrdersCount.set(count);
    });
  }

  pendingCount = computed(() => this.orders().filter(o => o.status === 'Pending').length);
  paidCount = computed(() => this.orders().filter(o => o.status === 'Paid').length);

  searchQuery = signal('');
  selectedStatus = signal('');

  filteredOrders = computed(() => {
    let filtered = this.orders();
    
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(o => 
        o.tenantName.toLowerCase().includes(query) || 
        o.id.toLowerCase().includes(query)
      );
    }

    const status = this.selectedStatus();
    if (status) {
      filtered = filtered.filter(o => o.status === status);
    }

    return filtered;
  });

  // Dropdown Logic
  isDropdownOpen = signal(false);
  dropdownSearchQuery = '';
  statuses: string[] = ['Pending', 'Approved', 'Paid', 'Rejected'];

  filteredStatuses = computed(() => {
    if (!this.dropdownSearchQuery) return this.statuses;
    return this.statuses.filter(s => s.toLowerCase().includes(this.dropdownSearchQuery.toLowerCase()));
  });

  // Selection Logic
  selectedOrderIds = signal<Set<string>>(new Set());
  isAllSelected = computed(() => {
    const filtered = this.filteredOrders();
    return filtered.length > 0 && filtered.every(o => this.selectedOrderIds().has(o.id));
  });

  toggleOrderSelection(id: string) {
    this.selectedOrderIds.update(set => {
      const newSet = new Set(set);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  toggleAllSelection() {
    const filtered = this.filteredOrders();
    if (this.isAllSelected()) {
      this.selectedOrderIds.update(set => {
        const newSet = new Set(set);
        filtered.forEach(o => newSet.delete(o.id));
        return newSet;
      });
    } else {
      this.selectedOrderIds.update(set => {
        const newSet = new Set(set);
        filtered.forEach(o => newSet.add(o.id));
        return newSet;
      });
    }
  }

  clearSelection() {
    this.selectedOrderIds.set(new Set());
  }

  // Modal Logic
  showAttachmentModal = signal(false);
  currentAttachmentUrl = signal('');

  viewAttachment(url: string, event: Event) {
    event.stopPropagation();
    this.currentAttachmentUrl.set(url);
    this.showAttachmentModal.set(true);
  }

  closeAttachmentModal() {
    this.showAttachmentModal.set(false);
  }

  // Confirmation Modal Logic
  showConfirmModal = signal(false);
  orderToAction = signal<SubscriptionOrder | null>(null);
  actionType = signal<'approve' | 'reject'>('approve');

  openConfirmModal(order: SubscriptionOrder, type: 'approve' | 'reject', event: Event) {
    event.stopPropagation();
    this.orderToAction.set(order);
    this.actionType.set(type);
    this.showConfirmModal.set(true);
  }

  closeConfirmModal() {
    this.showConfirmModal.set(false);
    this.orderToAction.set(null);
  }

  processAction() {
    const order = this.orderToAction();
    const type = this.actionType();
    
    if (order) {
      this.orders.update(allOrders => 
        allOrders.map(o => o.id === order.id 
          ? { ...o, status: type === 'approve' ? 'Approved' : 'Rejected' } 
          : o
        )
      );
    }
    
    this.closeConfirmModal();
  }

  // Export Modal Logic
  showExportModal = signal(false);
  exportStep = signal(1);
  exportFormat = signal<'excel' | 'pdf' | null>(null);
  exportPdfType = signal<'details' | 'rows'>('rows');
  exportDateFrom = signal('');
  exportDateTo = signal('');
  exportMode = signal<'all' | 'page' | 'filtered'>('all');

  openExportModal() {
    this.exportStep.set(1);
    this.exportFormat.set(null);
    this.exportPdfType.set('rows');
    this.exportDateFrom.set('');
    this.exportDateTo.set('');
    this.exportMode.set('all');
    this.showExportModal.set(true);
  }

  closeExportModal() {
    this.showExportModal.set(false);
  }

  selectExportFormat(format: 'excel' | 'pdf') {
    this.exportFormat.set(format);
  }

  nextExportStep() {
    if (this.exportStep() === 1) {
      if (!this.exportFormat()) return;
      this.exportStep.set(2);
    } else {
      this.startExport();
    }
  }

  startExport() {
    const format = this.exportFormat();
    if (!format) return;

    // 1. Determine data to export
    let dataToExport: SubscriptionOrder[] = [];
    const mode = this.exportMode();

    if (mode === 'all') {
      dataToExport = this.orders();
    } else if (mode === 'filtered') {
      dataToExport = this.filteredOrders();
    } else if (mode === 'page') {
      // Export only selected rows
      const selectedIds = this.selectedOrderIds();
      dataToExport = this.orders().filter(o => selectedIds.has(o.id));
    }

    // 2. Apply date filters if set
    const fromDate = this.exportDateFrom();
    const toDate = this.exportDateTo();

    if (fromDate || toDate) {
      dataToExport = dataToExport.filter(order => {
        const orderDate = new Date(order.orderDate);
        if (fromDate && orderDate < new Date(fromDate)) return false;
        if (toDate && orderDate > new Date(toDate)) return false;
        return true;
      });
    }

    // 3. Perform export
    if (format === 'excel') {
      this.exportToExcel(dataToExport);
    } else {
      if (this.exportPdfType() === 'details') {
        this.exportToPDFDetails(dataToExport);
      } else {
        this.exportToPDF(dataToExport);
      }
    }

    this.closeExportModal();
  }

  private exportToExcel(data: SubscriptionOrder[]) {
    const worksheet = XLSX.utils.json_to_sheet(data.map(o => ({
      'Order ID': o.id,
      'Tenant Name': o.tenantName,
      'Template': o.templateName,
      'Amount': o.amount,
      'Status': o.status,
      'Payment Method': o.paymentMethod,
      'Date': o.orderDate
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSX.writeFile(workbook, `subscription_orders_${new Date().getTime()}.xlsx`);
  }

  private exportToPDF(data: SubscriptionOrder[]) {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Subscription Orders Report', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = data.map(o => [
      o.id,
      o.tenantName,
      o.templateName,
      `$${o.amount}`,
      o.status,
      o.orderDate
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['ID', 'Tenant', 'Template', 'Amount', 'Status', 'Date']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
    });

    doc.save(`subscription_orders_${new Date().getTime()}.pdf`);
  }

  private exportToPDFDetails(data: SubscriptionOrder[]) {
    const doc = new jsPDF();
    let yPos = 20;

    data.forEach((order, index) => {
      if (index > 0 && yPos > 230) {
        doc.addPage();
        yPos = 20;
      }

      // Order Header
      doc.setFillColor(79, 70, 229); // Indigo-600
      doc.rect(14, yPos, 182, 10, 'F');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255); // White
      doc.setFont('helvetica', 'bold');
      doc.text(`SUBSCRIPTION ORDER: #${order.id}`, 18, yPos + 7);
      yPos += 15;

      // Details Grid
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont('helvetica', 'normal');
      
      const leftColLabel = 18;
      const leftColValue = 55;
      const rightColLabel = 110;
      const rightColValue = 145;

      doc.text('Tenant Name:', leftColLabel, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(order.tenantName, leftColValue, yPos);
      
      doc.setTextColor(100);
      doc.text('Order Date:', rightColLabel, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(order.orderDate, rightColValue, yPos);
      
      yPos += 8;
      
      doc.setTextColor(100);
      doc.text('Plan Template:', leftColLabel, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(order.templateName, leftColValue, yPos);
      
      doc.setTextColor(100);
      doc.text('Current Status:', rightColLabel, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(order.status, rightColValue, yPos);
      
      yPos += 8;
      
      doc.setTextColor(100);
      doc.text('Total Amount:', leftColLabel, yPos);
      doc.setTextColor(79, 70, 229); // Indigo-600
      doc.setFont('helvetica', 'bold');
      doc.text(`$${order.amount.toLocaleString()}`, leftColValue, yPos);
      
      doc.setTextColor(100);
      doc.setFont('helvetica', 'normal');
      doc.text('Payment Method:', rightColLabel, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(order.paymentMethod, rightColValue, yPos);

      yPos += 12;
      
      // Separator
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.line(14, yPos, 196, yPos);
      yPos += 12;
    });

    doc.save(`subscription_orders_detailed_${new Date().getTime()}.pdf`);
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen.update(v => !v);
  }

  selectStatus(status: string) {
    this.selectedStatus.set(status);
    this.isDropdownOpen.set(false);
    this.dropdownSearchQuery = '';
  }

  @HostListener('document:click')
  closeDropdown() {
    this.isDropdownOpen.set(false);
  }
}
