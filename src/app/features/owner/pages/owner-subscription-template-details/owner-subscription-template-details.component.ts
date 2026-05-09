import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { OwnerSubscriptionTemplatesDataService } from '../../data-access/owner-subscription-templates-data.service';
import { OwnerPlanCreateDataService } from '../../data-access/owner-plan-create-data.service';

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
export class OwnerSubscriptionTemplateDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private templatesData = inject(OwnerSubscriptionTemplatesDataService);
  private planData = inject(OwnerPlanCreateDataService);

  template = signal<TemplateDetails | null>(null);
  isLoading = signal(true);

  ngOnInit(): void {
    void this.loadTemplate();
  }

  private async loadTemplate(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/owner/subscriptions/templates']);
      return;
    }

    this.isLoading.set(true);
    try {
      const [template, plans] = await Promise.all([
        this.templatesData.fetchTemplateById(id),
        this.planData.listPlans(),
      ]);
      const selectedPlanName = plans.find((plan) => plan.id === template.selectedPlanId)?.name ?? template.selectedPlanId ?? 'N/A';

      this.template.set({
        id: template.id,
        name: template.name,
        billingCycle: template.billingCycle,
        gracePeriod: template.gracePeriod,
        status: template.status,
        plans: [selectedPlanName],
        paymentMethods: template.selectedMethods ?? [],
        discountType: template.discountType ?? 'none',
        discountValue: template.discountValue ?? 0,
        hasActiveSubscriptions: template.hasActiveSubscriptions,
        createdAt: template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'N/A',
      });
    } catch {
      this.router.navigate(['/owner/subscriptions/templates']);
    } finally {
      this.isLoading.set(false);
    }
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
