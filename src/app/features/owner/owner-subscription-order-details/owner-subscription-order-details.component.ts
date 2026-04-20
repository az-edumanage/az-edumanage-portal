import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface SubscriptionOrder {
  id: string;
  tenantName: string;
  templateName: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  paymentMethod: string;
  orderDate: string;
  attachmentUrl?: string;
  notes?: string;
}

@Component({
  selector: 'app-owner-subscription-order-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './owner-subscription-order-details.component.html'})
export class OwnerSubscriptionOrderDetailsComponent {
  private route = inject(ActivatedRoute);
  
  order = signal<SubscriptionOrder | null>(null);
  showAttachmentModal = signal(false);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    // Mock data fetching
    const mockOrders: SubscriptionOrder[] = [
      {
        id: 'ORD_1001',
        tenantName: 'Bright Future Academy',
        templateName: 'Standard Annual Contract',
        amount: 4500,
        status: 'Pending',
        paymentMethod: 'Bank Transfer',
        orderDate: 'Apr 10, 2024',
        attachmentUrl: 'https://picsum.photos/seed/receipt1/800/1200',
        notes: 'Please process this as soon as possible for our academic year start.'
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
    ];

    const found = mockOrders.find(o => o.id === id);
    if (found) {
      this.order.set(found);
    }
  }
}
