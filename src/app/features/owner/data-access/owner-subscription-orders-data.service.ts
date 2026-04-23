import { Injectable, signal } from '@angular/core';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SubscriptionOrder } from '../models/owner-subscription-orders.models';

@Injectable({ providedIn: 'root' })
export class OwnerSubscriptionOrdersDataService {
  readonly orders = signal<SubscriptionOrder[]>([
    {
      id: 'ORD_1001',
      tenantName: 'Bright Future Academy',
      templateName: 'Standard Annual Contract',
      amount: 4500,
      status: 'Pending',
      paymentMethod: 'Bank Transfer',
      orderDate: 'Apr 10, 2024',
      attachmentUrl: 'https://picsum.photos/seed/receipt1/800/1200',
    },
    {
      id: 'ORD_1002',
      tenantName: 'Cairo Math Center',
      templateName: 'Monthly Flexible Plan',
      amount: 149,
      status: 'Paid',
      paymentMethod: 'InstaPay',
      orderDate: 'Apr 08, 2024',
    },
    {
      id: 'ORD_1003',
      tenantName: 'Elite Tutors',
      templateName: 'Semester Academic Pack',
      amount: 800,
      status: 'Approved',
      paymentMethod: 'Wallet Transfer',
      orderDate: 'Apr 05, 2024',
      attachmentUrl: 'https://picsum.photos/seed/receipt2/800/1200',
    },
  ]);

  updateOrderStatus(orderId: string, status: SubscriptionOrder['status']): void {
    this.orders.update((all) =>
      all.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    );
  }

  exportToExcel(data: SubscriptionOrder[]): void {
    const worksheet = XLSX.utils.json_to_sheet(
      data.map((order) => ({
        'Order ID': order.id,
        'Tenant Name': order.tenantName,
        Template: order.templateName,
        Amount: order.amount,
        Status: order.status,
        'Payment Method': order.paymentMethod,
        Date: order.orderDate,
      })),
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSX.writeFile(workbook, `subscription_orders_${Date.now()}.xlsx`);
  }

  exportToPdfRows(data: SubscriptionOrder[]): void {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Subscription Orders Report', 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = data.map((order) => [
      order.id,
      order.tenantName,
      order.templateName,
      `$${order.amount}`,
      order.status,
      order.orderDate,
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['ID', 'Tenant', 'Template', 'Amount', 'Status', 'Date']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save(`subscription_orders_${Date.now()}.pdf`);
  }

  exportToPdfDetails(data: SubscriptionOrder[]): void {
    const doc = new jsPDF();
    let yPos = 20;

    data.forEach((order, index) => {
      if (index > 0 && yPos > 230) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(79, 70, 229);
      doc.rect(14, yPos, 182, 10, 'F');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(`SUBSCRIPTION ORDER: #${order.id}`, 18, yPos + 7);
      yPos += 15;

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
      doc.setTextColor(79, 70, 229);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${order.amount.toLocaleString()}`, leftColValue, yPos);

      doc.setTextColor(100);
      doc.setFont('helvetica', 'normal');
      doc.text('Payment Method:', rightColLabel, yPos);
      doc.setTextColor(30, 41, 59);
      doc.text(order.paymentMethod, rightColValue, yPos);

      yPos += 12;

      doc.setDrawColor(241, 245, 249);
      doc.line(14, yPos, 196, yPos);
      yPos += 12;
    });

    doc.save(`subscription_orders_detailed_${Date.now()}.pdf`);
  }
}
