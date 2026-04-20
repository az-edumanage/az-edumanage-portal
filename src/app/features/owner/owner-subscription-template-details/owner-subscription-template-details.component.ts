import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface TemplateDetails {
  id: string;
  name: string;
  billingCycle: string;
  gracePeriod: number;
  status: 'Active' | 'Draft' | 'Archived';
  plans: string[];
  paymentMethods: string[];
  discountType: 'percentage' | 'fixed' | 'none';
  discountValue: number;
  hasActiveSubscriptions: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-owner-subscription-template-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './owner-subscription-template-details.component.html',
  styleUrl: './owner-subscription-template-details.component.css'})
export class OwnerSubscriptionTemplateDetailsComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  template = signal<TemplateDetails | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    // Mock data based on ID
    this.template.set({
      id: id || 'TMP_001',
      name: id === 'TMP_001' ? 'Standard Annual Contract' : id === 'TMP_002' ? 'Monthly Flexible Plan' : 'Semester Academic Pack',
      billingCycle: id === 'TMP_001' ? 'Yearly' : id === 'TMP_002' ? 'Monthly' : 'Semester',
      gracePeriod: id === 'TMP_001' ? 15 : id === 'TMP_002' ? 5 : 30,
      status: id === 'TMP_003' ? 'Draft' : 'Active',
      plans: ['Starter Plan', 'Professional Plan', 'Enterprise Plan'],
      paymentMethods: ['Bank Transfer', 'InstaPay', 'Wallet Transfer'],
      discountType: id === 'TMP_001' ? 'percentage' : id === 'TMP_003' ? 'fixed' : 'none',
      discountValue: id === 'TMP_001' ? 10 : id === 'TMP_003' ? 50 : 0,
      hasActiveSubscriptions: id === 'TMP_001',
      createdAt: 'Jan 10, 2024'
    });
  }

  goBack() {
    this.router.navigate(['/owner/subscriptions/templates']);
  }

  editTemplate() {
    this.router.navigate(['/owner/subscriptions/templates', this.template()?.id, 'edit']);
  }

  deleteTemplate() {
    if (this.template()?.hasActiveSubscriptions) return;
    if (confirm('Are you sure you want to delete this template?')) {
      this.router.navigate(['/owner/subscriptions/templates']);
    }
  }
}
