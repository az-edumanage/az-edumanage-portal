export interface NotificationItem {
  id: string;
  title: string;
  type: 'Announcement' | 'Maintenance' | 'Security' | 'Billing';
  target: string;
  channels: string[];
  status: 'Draft' | 'Scheduled' | 'Sent' | 'Cancelled';
  createdBy: string;
  createdDate: string;
}
