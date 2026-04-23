import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-owner-notification-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './owner-notification-details.component.html',
  styleUrl: './owner-notification-details.component.css'})
export class OwnerNotificationDetailsComponent {
  private route = inject(ActivatedRoute);
  notificationId = signal<string | null>(null);

  constructor() {
    this.notificationId.set(this.route.snapshot.paramMap.get('id'));
  }
}
