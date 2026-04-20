import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

interface Feature {
  id: string;
  label: string;
  enabled: boolean;
}

interface Limit {
  id: string;
  label: string;
  value: number;
}

interface TenantOverride {
  tenantName: string;
  plan: string;
  status: 'Forced Enabled' | 'Forced Disabled';
  reason: string;
  expiryDate?: string;
}

interface ChangeLog {
  user: string;
  action: string;
  date: string;
  details: string;
}

@Component({
  selector: 'app-owner-academic-structure-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-academic-structure-details.component.html',
  styleUrl: './owner-academic-structure-details.component.css'})
export class OwnerAcademicStructureDetailsComponent {
  activeTab = signal<string>('overview');

  tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'settings', label: 'Settings' },
    { id: 'plans', label: 'Plan Assignment' },
    { id: 'overrides', label: 'Tenant Overrides' },
    { id: 'dependencies', label: 'Dependencies' },
    { id: 'changelog', label: 'Change Log' },
  ];

  features = signal<Feature[]>([
    { id: 'feat-years', label: 'Manage Academic Years', enabled: true },
    { id: 'feat-terms', label: 'Manage Terms', enabled: true },
    { id: 'feat-levels', label: 'Manage Education Levels', enabled: true },
    { id: 'feat-grades', label: 'Manage Grades', enabled: true },
    { id: 'feat-classes', label: 'Manage Classes', enabled: true },
    { id: 'feat-groups', label: 'Manage Groups', enabled: true },
    { id: 'feat-clone', label: 'Clone Academic Structure', enabled: false },
    { id: 'feat-promo', label: 'Year Promotion', enabled: true },
    { id: 'feat-adv', label: 'Advanced Academic Settings', enabled: false },
    { id: 'feat-multi', label: 'Multi-Branch Academic Structure', enabled: false },
  ]);

  limits = signal<Limit[]>([
    { id: 'limit-years', label: 'Max academic years', value: 10 },
    { id: 'limit-levels', label: 'Max levels', value: 6 },
    { id: 'limit-grades', label: 'Max grades per level', value: 10 },
    { id: 'limit-classes', label: 'Max classes per branch', value: 100 },
  ]);

  availablePlans = [
    { name: 'Starter', tenantCount: 45 },
    { name: 'Professional', tenantCount: 60 },
    { name: 'Enterprise', tenantCount: 19 }
  ];

  overrides: TenantOverride[] = [
    { tenantName: 'Cairo Math Center', plan: 'Starter', status: 'Forced Enabled', reason: 'Beta Tester', expiryDate: '2024-12-31' },
    { tenantName: 'Elite Tutors', plan: 'Professional', status: 'Forced Disabled', reason: 'Payment Dispute' }
  ];

  changeLogs: ChangeLog[] = [
    { user: 'Admin User', action: 'Module Enabled', date: 'Jan 12, 2023 10:30 AM', details: 'Module status changed from Disabled to Enabled.' },
    { user: 'System', action: 'Plan Assignment Updated', date: 'Feb 01, 2023 02:15 PM', details: 'Added to all plans as core module.' },
    { user: 'Support Agent', action: 'Tenant Override Added', date: 'Mar 15, 2023 09:45 AM', details: 'Forced Enabled for tenant "Cairo Math Center".' }
  ];
}
