import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NotificationsService, UserNotificationToast } from '../../services/notifications.service';

@Component({
  selector: 'app-notification-toast-host',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './notification-toast-host.component.html',
  styleUrl: './notification-toast-host.component.css',
})
export class NotificationToastHostComponent {
  private readonly notificationsService = inject(NotificationsService);
  private readonly router = inject(Router);

  readonly toasts = this.notificationsService.toasts;

  dismissToast(event: MouseEvent, toast: UserNotificationToast): void {
    event.stopPropagation();
    this.notificationsService.dismissToast(toast.id);
  }

  async openToast(toast: UserNotificationToast): Promise<void> {
    this.notificationsService.dismissToast(toast.id);
    await this.notificationsService.markReadById(toast.id);
    if (toast.linkPath) {
      await this.router.navigateByUrl(toast.linkPath);
    }
  }
}
