import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SubscriptionTemplate } from '../models/owner-subscription-templates.models';
import { OwnerSubscriptionTemplatesListStore } from './owner-subscription-templates-list.store';

@Injectable({ providedIn: 'root' })
export class OwnerSubscriptionTemplatesListFacade {
  private readonly store = inject(OwnerSubscriptionTemplatesListStore);
  private readonly router = inject(Router);

  readonly templates = this.store.templates;

  viewDetails(id: string): void {
    this.router.navigate(['/owner/subscriptions/templates', id]);
  }

  editTemplate(id: string): void {
    this.router.navigate(['/owner/subscriptions/templates', id, 'edit']);
  }

  deleteTemplate(template: SubscriptionTemplate): void {
    if (template.hasActiveSubscriptions) {
      console.warn('Cannot delete template with active subscriptions');
      return;
    }

    if (confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      this.templates.update((prev) => prev.filter((item) => item.id !== template.id));
    }
  }
}
