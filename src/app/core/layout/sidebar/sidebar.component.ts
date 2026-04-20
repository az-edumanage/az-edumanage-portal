import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../services/dashboard.service';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  badge?: number;
  children?: MenuItem[];
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'})
export class SidebarComponent {
  private dashboardService = inject(DashboardService);
  
  collapsed = this.dashboardService.sidebarCollapsed;
  currentRole = this.dashboardService.currentRole;

  openAccordions = signal<Record<string, boolean>>({});

  toggleAccordion(label: string) {
    this.openAccordions.update((prev: Record<string, boolean>) => ({
      ...prev,
      [label]: !prev[label]
    }));
  }

  isAccordionOpen(label: string): boolean {
    return !!this.openAccordions()[label];
  }

  userInitials = computed(() => {
    return this.currentRole().substring(0, 2).toUpperCase();
  });

  menuSections = computed<MenuSection[]>(() => {
    const role = this.currentRole();
    const pendingOrders = this.dashboardService.pendingSubscriptionOrdersCount();
    
    switch (role) {
      case 'owner':
        return [
          {
            title: 'Business Core',
            items: [
              { label: 'Dashboard', icon: 'dashboard', route: '/owner/overview' },
              { label: 'Tenants', icon: 'business', route: '/owner/tenants' },
              { label: 'Plans', icon: 'layers', route: '/owner/plans' },
              { 
                label: 'Subscriptions', 
                icon: 'card_membership', 
                badge: pendingOrders,
                children: [
                  { label: 'View Subscriptions', icon: '', route: '/owner/subscriptions' },
                  { label: 'Subscription Templates', icon: '', route: '/owner/subscriptions/templates' },
                  { label: 'Subscription Orders', icon: '', route: '/owner/subscriptions/orders', badge: pendingOrders }
                ]
              },
              { label: 'Billing', icon: 'receipt_long', route: '/owner/billing' },
            ]
          },
          {
            title: 'Product Management',
            items: [
              { label: 'Modules', icon: 'extension', route: '/owner/modules' },
              { label: 'Usage Analytics', icon: 'insights', route: '/owner/analytics' },
            ]
          },
          {
            title: 'Operations',
            items: [
              { label: 'Provisioning', icon: 'cloud_upload', route: '/owner/provisioning' },
              { label: 'Integrations', icon: 'hub', route: '/owner/integrations' },
              { label: 'Monitoring', icon: 'monitor_heart', route: '/owner/monitoring' },
            ]
          },
          {
            title: 'Governance & Security',
            items: [
              { label: 'Platform Users', icon: 'manage_accounts', route: '/owner/users' },
              { label: 'Security', icon: 'security', route: '/owner/security' },
              { label: 'Audit Logs', icon: 'history_edu', route: '/owner/audit' },
              { label: 'Compliance', icon: 'gavel', route: '/owner/compliance' },
            ]
          },
          {
            title: 'System',
            items: [
              { label: 'Notifications', icon: 'notifications', route: '/owner/notifications' },
              { label: 'Settings', icon: 'settings', route: '/owner/settings' },
            ]
          }
        ];
      case 'tenant':
        return [
          {
            title: 'Main',
            items: [
              { label: 'Overview', icon: 'dashboard', route: '/tenant/overview' },
              { label: 'Students', icon: 'school', route: '/tenant/students' },
              { label: 'Teachers', icon: 'person_outline', route: '/tenant/teachers' },
              { label: 'Groups/Classes', icon: 'groups', route: '/tenant/groups' },
            ]
          },
          {
            title: 'Academic',
            items: [
              { label: 'Schedule', icon: 'calendar_today', route: '/tenant/schedule' },
              { label: 'Attendance', icon: 'fact_check', route: '/tenant/attendance' },
              { label: 'Exams & Grades', icon: 'assignment', route: '/tenant/exams' },
            ]
          },
          {
            title: 'Finance & Admin',
            items: [
              { label: 'Billing', icon: 'receipt_long', route: '/tenant/billing' },
              { label: 'Reports', icon: 'bar_chart', route: '/tenant/reports' },
              { label: 'Settings', icon: 'settings', route: '/tenant/settings' },
            ]
          },
          {
            title: 'Development',
            items: [
              { label: 'Design System', icon: 'palette', route: '/design-system' },
            ]
          }
        ];
      case 'teacher':
        return [
          {
            title: 'Main',
            items: [
              { label: 'Overview', icon: 'dashboard', route: '/teacher/overview' },
              { label: 'My Schedule', icon: 'calendar_month', route: '/teacher/schedule' },
              { label: 'My Groups', icon: 'groups', route: '/teacher/groups' },
              { label: 'Attendance', icon: 'fact_check', route: '/teacher/attendance' },
              { label: 'Exams & Grades', icon: 'assignment_turned_in', route: '/teacher/grades' },
              { label: 'Messages', icon: 'chat', route: '/teacher/messages' },
              { label: 'Profile', icon: 'person', route: '/teacher/profile' },
            ]
          }
        ];
      default:
        return [];
    }
  });
}
