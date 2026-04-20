import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { OwnerModule } from '../models/owner-modules.models';

interface Feature {
  id: string;
  label: string;
  enabled: boolean;
}

interface Limit {
  id: string;
  label: string;
  value: number | boolean;
  type: 'number' | 'boolean';
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
  selector: 'app-owner-module-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-module-details.component.html'})
export class OwnerModuleDetailsComponent {
  private route = inject(ActivatedRoute);
  activeTab = signal<'overview' | 'settings' | 'plans' | 'overrides' | 'dependencies' | 'changelog'>('overview');

  module = signal<OwnerModule>({
    id: 'mod-students',
    name: 'Students Management',
    code: 'CORE_STUD',
    description: 'Comprehensive student profiles, enrollment, and history.',
    category: 'Core Business',
    status: 'Enabled',
    activeTenantsCount: 124,
    lastUpdated: '1 week ago',
    includedInPlans: ['All Plans'],
    icon: 'people'
  });

  features = signal<Feature[]>([]);
  limits = signal<Limit[]>([]);

  private studentFeatures: Feature[] = [
    { id: 'feat-profile', label: 'Student Basic Profile', enabled: true },
    { id: 'feat-contact', label: 'Student Contact Details', enabled: true },
    { id: 'feat-enroll', label: 'Enrollment Management', enabled: true },
    { id: 'feat-transfer', label: 'Enrollment Transfer', enabled: true },
    { id: 'feat-history', label: 'Academic History', enabled: true },
    { id: 'feat-docs', label: 'Student Documents', enabled: true },
    { id: 'feat-notes', label: 'Student Notes', enabled: true },
    { id: 'feat-behavior', label: 'Behavior Tracking', enabled: true },
    { id: 'feat-attendance', label: 'Attendance View', enabled: true },
    { id: 'feat-grades', label: 'Exam & Grades View', enabled: true },
    { id: 'feat-finance', label: 'Finance View', enabled: true },
    { id: 'feat-import', label: 'Bulk Import', enabled: true },
    { id: 'feat-update', label: 'Bulk Update', enabled: true },
    { id: 'feat-search', label: 'Advanced Search', enabled: true },
    { id: 'feat-status', label: 'Student Status Management', enabled: true },
    { id: 'feat-tags', label: 'Tags & Labels', enabled: true },
  ];

  private userFeatures: Feature[] = [
    { id: 'feat-user-acc', label: 'Manage User Accounts', enabled: true },
    { id: 'feat-roles', label: 'Manage Roles', enabled: true },
    { id: 'feat-perms', label: 'Manage Permissions', enabled: true },
    { id: 'feat-branch', label: 'Restrict by Branch', enabled: true },
    { id: 'feat-scope', label: 'Restrict by Academic Scope', enabled: true },
    { id: 'feat-multi-roles', label: 'Allow Multiple Roles', enabled: true },
    { id: 'feat-overrides', label: 'Enable Direct Permission Overrides', enabled: true },
    { id: 'feat-pwd', label: 'Enable Password Policy', enabled: true },
    { id: 'feat-2fa', label: 'Enable Two-Factor Authentication', enabled: true },
    { id: 'feat-session', label: 'Enable Session Management', enabled: true },
    { id: 'feat-track', label: 'Track User Activity', enabled: true },
    { id: 'feat-audit', label: 'Enable Audit Logs', enabled: true },
    { id: 'feat-time', label: 'Restrict Login by Time', enabled: true },
    { id: 'feat-ip', label: 'Restrict Login by IP', enabled: true },
    { id: 'feat-device', label: 'Restrict Login by Device', enabled: true },
    { id: 'feat-import-u', label: 'Allow Users Import', enabled: true },
    { id: 'feat-export-u', label: 'Allow Users Export', enabled: true },
  ];

  private schedulingFeatures: Feature[] = [
    { id: 'feat-weekly', label: 'Enable Weekly Timetable', enabled: true },
    { id: 'feat-teacher', label: 'Enable Teacher Allocation', enabled: true },
    { id: 'feat-student', label: 'Enable Student Allocation', enabled: true },
    { id: 'feat-room', label: 'Enable Room Allocation', enabled: true },
    { id: 'feat-conflict', label: 'Enable Conflict Detection', enabled: true },
    { id: 'feat-auto', label: 'Enable Auto Scheduling', enabled: true },
    { id: 'feat-reschedule', label: 'Enable Reschedule & Cancellation', enabled: true },
    { id: 'feat-notify', label: 'Enable Notifications on Schedule Changes', enabled: true },
    { id: 'feat-attendance', label: 'Enable Attendance Integration', enabled: true },
    { id: 'feat-exam', label: 'Enable Exam Timetable', enabled: true },
    { id: 'feat-reports', label: 'Enable Reports & Analytics', enabled: true },
  ];

  constructor() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.loadModuleData(id);
    });
  }

  loadModuleData(id: string) {
    if (id === 'mod-users') {
      this.module.set({
        id: 'mod-users',
        name: 'Users Management',
        code: 'SYS_USERS',
        description: 'System users, roles, and access control.',
        category: 'Core System',
        status: 'Enabled',
        activeTenantsCount: 124,
        lastUpdated: '1 month ago',
        includedInPlans: ['All Plans'],
        icon: 'manage_accounts'
      });
      this.features.set(this.userFeatures);
      this.limits.set([
        { id: 'limit-users', label: 'Max users per center', value: 50, type: 'number' },
        { id: 'limit-roles', label: 'Max custom roles', value: 10, type: 'number' },
      ]);
    } else if (id === 'mod-sched') {
      this.module.set({
        id: 'mod-sched',
        name: 'Scheduling & Timetable',
        code: 'CORE_SCHED',
        description: 'Class scheduling, teacher allocation, and conflict detection.',
        category: 'Core Business',
        status: 'Enabled',
        activeTenantsCount: 124,
        lastUpdated: '3 days ago',
        includedInPlans: ['All Plans'],
        icon: 'calendar_today'
      });
      this.features.set(this.schedulingFeatures);
      this.limits.set([
        { id: 'limit-schedules', label: 'Max schedules per branch', value: 100, type: 'number' },
        { id: 'limit-rooms', label: 'Max active rooms in timetable', value: 20, type: 'number' },
        { id: 'limit-teachers', label: 'Max teachers in scheduling system', value: 50, type: 'number' },
        { id: 'limit-groups', label: 'Max groups per academic term', value: 40, type: 'number' },
        { id: 'limit-multi-branch', label: 'Allow multi-branch scheduling', value: true, type: 'boolean' },
      ]);
    } else {
      // Default to students for now as it was the previous state
      this.module.set({
        id: 'mod-students',
        name: 'Students Management',
        code: 'CORE_STUD',
        description: 'Comprehensive student profiles, enrollment, and history.',
        category: 'Core Business',
        status: 'Enabled',
        activeTenantsCount: 124,
        lastUpdated: '1 week ago',
        includedInPlans: ['All Plans'],
        icon: 'people'
      });
      this.features.set(this.studentFeatures);
      this.limits.set([
        { id: 'limit-students', label: 'Max students per center', value: 1000, type: 'number' },
        { id: 'limit-docs', label: 'Max documents per student', value: 20, type: 'number' },
        { id: 'limit-tags', label: 'Max tags per student', value: 10, type: 'number' },
        { id: 'limit-notes', label: 'Max notes per student', value: 50, type: 'number' },
      ]);
    }
  }

  availablePlans = [
    { name: 'Starter', tenantCount: 45 },
    { name: 'Professional', tenantCount: 60 },
    { name: 'Enterprise', tenantCount: 19 }
  ];

  overrides: TenantOverride[] = [
    { tenantName: 'Cairo Math Center', plan: 'Starter', status: 'Forced Enabled', reason: 'Beta Tester', expiryDate: '2024-12-31' },
    { tenantName: 'Elite Tutors', plan: 'Professional', status: 'Forced Disabled', reason: 'Payment Dispute' }
  ];

  dependencies = {
    dependsOn: ['Academic Structure'],
    requiredBy: ['Exams & Grades', 'Finance', 'Parent Portal']
  };

  changeLogs: ChangeLog[] = [
    { user: 'Admin User', action: 'Module Enabled', date: 'Jan 12, 2023 10:30 AM', details: 'Module status changed from Disabled to Enabled.' },
    { user: 'System', action: 'Plan Assignment Updated', date: 'Feb 01, 2023 02:15 PM', details: 'Added to "Professional" plan.' },
    { user: 'Support Agent', action: 'Tenant Override Added', date: 'Mar 15, 2023 09:45 AM', details: 'Forced Enabled for tenant "Cairo Math Center".' }
  ];

  toggleStatus() {
    if (this.module().category !== 'Advanced') return;
    
    const newStatus = this.module().status === 'Enabled' ? 'Disabled' : 'Enabled';
    
    if (newStatus === 'Disabled') {
      if (this.module().activeTenantsCount > 0) {
        if (!confirm(`WARNING: This module is currently used by ${this.module().activeTenantsCount} active tenants. Disabling it will immediately revoke access. Are you sure?`)) {
          return;
        }
      }
      if (this.dependencies.requiredBy.length > 0) {
        alert(`Cannot disable module. It is required by: ${this.dependencies.requiredBy.join(', ')}`);
        return;
      }
    }

    this.module.update(m => ({ ...m, status: newStatus }));
  }
}
