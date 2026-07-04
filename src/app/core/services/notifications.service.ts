import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserNotification {
  id: string;
  title: string;
  body: string;
  linkPath: string;
  recipientRole: string;
  createdAt: string;
  read: boolean;
}

interface UserNotificationSummaryResponse {
  unreadCount: number;
  notifications: UserNotification[];
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/notifications`;

  readonly notifications = signal<UserNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly isLoading = signal(false);

  async refresh(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<UserNotificationSummaryResponse>(`${this.url}/me`),
      );
      this.notifications.set(response.notifications ?? []);
      this.unreadCount.set(response.unreadCount ?? 0);
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
    await firstValueFrom(this.http.patch<UserNotification>(`${this.url}/${notification.id}/read`, {}));
    this.notifications.update((items) =>
      items.map((item) => item.id === notification.id ? { ...item, read: true } : item),
    );
    this.unreadCount.update((count) => Math.max(0, count - 1));
  }
}
