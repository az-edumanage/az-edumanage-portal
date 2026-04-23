import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { OwnerNotificationsListFacade } from '../../state/owner-notifications-list.facade';

@Component({
  selector: 'app-owner-notifications-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './owner-notifications-list.component.html',
  styleUrl: './owner-notifications-list.component.css'})
export class OwnerNotificationsListComponent {
  private readonly facade = inject(OwnerNotificationsListFacade);

  readonly notifications = this.facade.notifications;
}
