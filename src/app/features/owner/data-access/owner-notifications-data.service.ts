import { Injectable, signal } from '@angular/core';
import { NotificationItem } from '../models/owner-notifications.models';

@Injectable({ providedIn: 'root' })
export class OwnerNotificationsDataService {
  readonly notifications = signal<NotificationItem[]>([
    {
      id: 'NTF-001',
      title: 'Scheduled System Maintenance',
      type: 'Maintenance',
      target: 'All Tenants',
      channels: ['In-App', 'Email'],
      status: 'Scheduled',
      createdBy: 'System Admin',
      createdDate: '2024-05-20',
    },
    {
      id: 'NTF-002',
      title: 'New Feature: AI Student Reports',
      type: 'Announcement',
      target: 'Enterprise Plan',
      channels: ['In-App'],
      status: 'Sent',
      createdBy: 'Product Manager',
      createdDate: '2024-05-18',
    },
    {
      id: 'NTF-003',
      title: 'Urgent Security Update: Password Policy',
      type: 'Security',
      target: 'All Tenants',
      channels: ['In-App', 'Email', 'SMS'],
      status: 'Sent',
      createdBy: 'Security Officer',
      createdDate: '2024-05-15',
    },
    {
      id: 'NTF-004',
      title: 'Upcoming Billing Cycle Changes',
      type: 'Billing',
      target: 'Starter Plan',
      channels: ['Email'],
      status: 'Draft',
      createdBy: 'Finance Team',
      createdDate: '2024-05-21',
    },
  ]);
}
