import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './owner-dashboard.component.html'})
export class OwnerDashboardComponent {
  plans = [
    { name: 'Enterprise', percentage: 45, color: 'bg-indigo-500' },
    { name: 'Professional', percentage: 35, color: 'bg-blue-500' },
    { name: 'Starter', percentage: 20, color: 'bg-sky-400' }
  ];

  latestTenants = [
    { name: 'Bright Future Academy', plan: 'Enterprise', status: 'Active', date: '2 mins ago' },
    { name: 'Cairo Math Center', plan: 'Professional', status: 'Trial', date: '15 mins ago' },
    { name: 'Elite Tutors', plan: 'Starter', status: 'Active', date: '1 hour ago' },
    { name: 'Physics Pro', plan: 'Professional', status: 'Active', date: '3 hours ago' },
    { name: 'Language Hub', plan: 'Starter', status: 'Trial', date: '5 hours ago' }
  ];

  failures = [
    { tenant: 'New Horizon', step: 'Database Migration', error: 'Connection timeout' },
    { tenant: 'Alpha Learning', step: 'DNS Propagation', error: 'Record not found' },
    { tenant: 'Beta School', step: 'User Import', error: 'CSV format invalid' }
  ];
}
