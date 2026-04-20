import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { SubscriptionTemplate } from '../models/owner-subscription-templates.models';
import { OwnerSubscriptionTemplatesListFacade } from '../state/owner-subscription-templates-list.facade';

@Component({
  selector: 'app-owner-subscription-templates-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-subscription-templates-list.component.html'})
export class OwnerSubscriptionTemplatesListComponent {
  private readonly facade = inject(OwnerSubscriptionTemplatesListFacade);

  readonly templates = this.facade.templates;

  viewDetails(id: string): void {
    this.facade.viewDetails(id);
  }

  editTemplate(id: string): void {
    this.facade.editTemplate(id);
  }

  deleteTemplate(template: SubscriptionTemplate): void {
    this.facade.deleteTemplate(template);
  }
}
