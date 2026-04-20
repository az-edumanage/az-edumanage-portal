import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

interface SubscriptionTemplate {
  id: string;
  name: string;
  billingCycle: string;
  gracePeriod: number;
  plansCount: number;
  paymentMethodsCount: number;
  discount: string;
  status: 'Active' | 'Draft' | 'Archived';
  hasActiveSubscriptions: boolean;
}

@Component({
  selector: 'app-owner-subscription-templates-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-subscription-templates-list.component.html'})
export class OwnerSubscriptionTemplatesListComponent {
  private router = inject(Router);

  templates = signal<SubscriptionTemplate[]>([
    {
      id: 'TMP_001',
      name: 'Standard Annual Contract',
      billingCycle: 'Yearly',
      gracePeriod: 15,
      plansCount: 3,
      paymentMethodsCount: 4,
      discount: '10%',
      status: 'Active',
      hasActiveSubscriptions: true
    },
    {
      id: 'TMP_002',
      name: 'Monthly Flexible Plan',
      billingCycle: 'Monthly',
      gracePeriod: 5,
      plansCount: 2,
      paymentMethodsCount: 2,
      discount: 'None',
      status: 'Active',
      hasActiveSubscriptions: false
    },
    {
      id: 'TMP_003',
      name: 'Semester Academic Pack',
      billingCycle: 'Semester',
      gracePeriod: 30,
      plansCount: 1,
      paymentMethodsCount: 3,
      discount: '$50 Fixed',
      status: 'Draft',
      hasActiveSubscriptions: false
    }
  ]);

  viewDetails(id: string) {
    this.router.navigate(['/owner/subscriptions/templates', id]);
  }

  editTemplate(id: string) {
    this.router.navigate(['/owner/subscriptions/templates', id, 'edit']);
  }

  deleteTemplate(template: SubscriptionTemplate) {
    if (template.hasActiveSubscriptions) {
      // In a real app, we'd show a toast or modal
      console.warn('Cannot delete template with active subscriptions');
      return;
    }
    
    if (confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      this.templates.update(prev => prev.filter(t => t.id !== template.id));
    }
  }
}
