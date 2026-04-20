import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

interface PrivacyRequest {
  id: string;
  tenant: string;
  type: 'Access' | 'Deletion';
  status: 'Pending' | 'In Progress' | 'Completed';
  requestDate: string;
  daysLeft: number;
}

interface ComplianceLog {
  id: string;
  action: string;
  user: string;
  date: string;
  details: string;
}

@Component({
  selector: 'app-owner-compliance',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './owner-compliance.component.html',
  styleUrl: './owner-compliance.component.css'})
export class OwnerComplianceComponent {
  activeTab = signal('retention');
  showDeleteDialog = false;
  deleteType = 'soft';
  deleteReason = '';
  confirmIrreversible = false;

  tabs = [
    { id: 'retention', label: 'Data Retention' },
    { id: 'tenant', label: 'Tenant Management' },
    { id: 'privacy', label: 'Privacy Requests' },
    { id: 'security', label: 'Security Policies' },
    { id: 'logs', label: 'Compliance Logs' },
  ];

  privacyRequests: PrivacyRequest[] = [
    { id: 'REQ-8821', tenant: 'Bright Future Academy', type: 'Access', status: 'Pending', requestDate: '2024-05-18', daysLeft: 28 },
    { id: 'REQ-8819', tenant: 'Elite Tutors', type: 'Deletion', status: 'In Progress', requestDate: '2024-05-15', daysLeft: 25 },
    { id: 'REQ-8815', tenant: 'Cairo Math Center', type: 'Access', status: 'Completed', requestDate: '2024-05-10', daysLeft: 0 },
    { id: 'REQ-8802', tenant: 'Physics Pro', type: 'Deletion', status: 'Pending', requestDate: '2024-05-20', daysLeft: 30 },
  ];

  complianceLogs: ComplianceLog[] = [
    { id: '1', action: 'Retention Policy Updated', user: 'admin@remix.com', date: '2024-05-20 14:30', details: 'Student Data: 5y -> 7y' },
    { id: '2', action: 'Full Data Export', user: 'security_officer@remix.com', date: '2024-05-19 09:15', details: 'Tenant: Elite Tutors' },
    { id: '3', action: 'MFA Enforced', user: 'admin@remix.com', date: '2024-05-18 16:45', details: 'Global Policy' },
    { id: '4', action: 'Hard Delete Executed', user: 'admin@remix.com', date: '2024-05-17 11:20', details: 'Tenant ID: 4421 (Legacy)' },
    { id: '5', action: 'IP Whitelist Modified', user: 'dev_ops@remix.com', date: '2024-05-16 13:10', details: 'Added: 192.168.1.0/24' },
  ];
}
