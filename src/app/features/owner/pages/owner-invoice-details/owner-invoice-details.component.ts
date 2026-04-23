import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceDetails {
  id: string;
  issueDate: string;
  dueDate: string;
  status: 'Paid' | 'Unpaid' | 'Overdue' | 'Cancelled' | 'Refunded';
  tenant: {
    name: string;
    address: string;
    email: string;
    taxId?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}

@Component({
  selector: 'app-owner-invoice-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './owner-invoice-details.component.html',
  styleUrl: './owner-invoice-details.component.css'})
export class OwnerInvoiceDetailsComponent {
  private route = inject(ActivatedRoute);

  showAttachment = signal<boolean>(false);
  statusOptions: InvoiceDetails['status'][] = ['Paid', 'Unpaid', 'Overdue', 'Cancelled', 'Refunded'];

  invoice = signal<InvoiceDetails>({
    id: 'INV-2024-001',
    issueDate: 'Jan 15, 2024',
    dueDate: 'Jan 15, 2024',
    status: 'Unpaid', // Changed to Unpaid for demo purposes
    tenant: {
      name: 'Bright Future Academy',
      address: '123 Education St, Cairo, Egypt',
      email: 'admin@brightfuture.edu',
      taxId: 'EG-987654321'
    },
    items: [
      { description: 'Enterprise Plan Subscription (Yearly)', quantity: 1, unitPrice: 4377.19, total: 4377.19 },
      { description: 'SMS Integration Add-on', quantity: 1, unitPrice: 0, total: 0 }
    ],
    subtotal: 4377.19,
    tax: 612.81,
    total: 4990.00,
    notes: 'Includes 14% VAT. Payment received via Bank Transfer.'
  });

  updateStatus(newStatus: InvoiceDetails['status']) {
    this.invoice.update(inv => ({ ...inv, status: newStatus }));
  }

  printInvoice() {
    window.print();
  }

  async downloadPdf() {
    const element = document.getElementById('invoice-content');
    if (!element) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('invoice-content');
          if (clonedElement) {
            clonedElement.classList.remove('dark:bg-slate-900', 'dark:border-slate-800');
            clonedElement.classList.add('bg-white', 'text-slate-900');

            // Simplified style processing to avoid build hangs
            const processStyles = (el: HTMLElement, orig: Element) => {
              const style = window.getComputedStyle(orig);
              const props = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'fill', 'stroke'];
              
              props.forEach(prop => {
                const val = style.getPropertyValue(prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`));
                if (val && val.includes('oklch')) {
                  // Fallback to a safe color if oklch is detected
                  // @ts-expect-error - style access
                  el.style[prop] = val.includes('white') || val.includes('slate-900') ? val : '#6366f1'; 
                }
              });
            };

            const originalElements = element.querySelectorAll('*');
            const clonedElements = clonedElement.querySelectorAll('*');
            
            originalElements.forEach((orig, index) => {
              if (clonedElements[index]) {
                processStyles(clonedElements[index] as HTMLElement, orig);
              }
            });

            // Remove problematic styles
            const styles = clonedDoc.getElementsByTagName('style');
            for (let i = styles.length - 1; i >= 0; i--) styles[i].remove();
            const links = clonedDoc.getElementsByTagName('link');
            for (let i = links.length - 1; i >= 0; i--) if (links[i].rel === 'stylesheet') links[i].remove();
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${this.invoice().id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  }
}
