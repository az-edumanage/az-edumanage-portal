import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardService } from './dashboard.service';

export interface UserNotification {
  id: string;
  title: string;
  body: string;
  linkPath: string;
  recipientRole: string;
  createdAt: string;
  read: boolean;
}

export interface UserNotificationToast {
  id: string;
  title: string;
  body: string;
  linkPath: string;
  createdAt: string;
}

interface UserNotificationSummaryResponse {
  unreadCount: number;
  notifications: UserNotification[];
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly dashboardService = inject(DashboardService);
  private readonly url = `${environment.apiBaseUrl}/notifications`;
  private readonly toastableRoles = new Set(['tenant', 'teacher', 'student', 'parent']);
  private readonly toastedNotificationIds = new Set<string>();
  private readonly toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  readonly notifications = signal<UserNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly isLoading = signal(false);
  readonly toasts = signal<UserNotificationToast[]>([]);

  async refresh(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<UserNotificationSummaryResponse>(`${this.url}/me`),
      );
      const notifications = response.notifications ?? [];
      this.notifications.set(notifications);
      this.unreadCount.set(response.unreadCount ?? 0);
      this.enqueueToasts(notifications);
    } catch {
      this.notifications.set([]);
      this.unreadCount.set(0);
    } finally {
      this.isLoading.set(false);
    }
  }

  async markRead(notification: UserNotification): Promise<void> {
    if (!notification.id || notification.read) {
      return;
    }
    await this.markReadById(notification.id);
  }

  async markReadById(notificationId: string): Promise<void> {
    if (!notificationId) {
      return;
    }
    const notification = this.notifications().find((item) => item.id === notificationId);
    if (notification?.read) {
      return;
    }
    await firstValueFrom(this.http.patch<UserNotification>(`${this.url}/${notificationId}/read`, {}));
    this.notifications.update((items) =>
      items.map((item) => item.id === notificationId ? { ...item, read: true } : item),
    );
    this.unreadCount.update((count) => Math.max(0, count - 1));
  }

  dismissToast(notificationId: string): void {
    this.clearToastTimeout(notificationId);
    this.toasts.update((items) => items.filter((item) => item.id !== notificationId));
  }

  private enqueueToasts(notifications: UserNotification[]): void {
    const role = this.dashboardService.currentRole();
    if (!role || !this.toastableRoles.has(role)) {
      return;
    }

    const newToasts = notifications
      .filter((notification) => !notification.read && !this.toastedNotificationIds.has(notification.id))
      .map((notification) => {
        this.toastedNotificationIds.add(notification.id);
        return {
          id: notification.id,
          title: notification.title,
          body: notification.body,
          linkPath: notification.linkPath,
          createdAt: notification.createdAt,
        };
      });

    if (!newToasts.length) {
      return;
    }

    this.toasts.update((items) => [...newToasts, ...items].slice(0, 5));
    for (const toast of newToasts) {
      this.scheduleToastDismissal(toast.id);
    }
  }

  private scheduleToastDismissal(notificationId: string): void {
    this.clearToastTimeout(notificationId);
    this.toastTimeouts.set(notificationId, setTimeout(() => this.dismissToast(notificationId), 7000));
  }

  private clearToastTimeout(notificationId: string): void {
    const timeout = this.toastTimeouts.get(notificationId);
    if (timeout) {
      clearTimeout(timeout);
      this.toastTimeouts.delete(notificationId);
    }
  }
}
