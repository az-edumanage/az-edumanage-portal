import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-owner-subscription-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './owner-subscription-details.component.html',
  styleUrl: './owner-subscription-details.component.css'
})
export class OwnerSubscriptionDetailsComponent {
  private route = inject(ActivatedRoute);
}
