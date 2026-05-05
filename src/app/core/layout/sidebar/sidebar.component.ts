import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../services/dashboard.service';
import { I18nService } from '../../services/i18n.service';
import { AuthTokenService } from '../../auth/auth-token.service';
import { AuthIdentityService } from '../../auth/auth-identity.service';
import { AuthApiService } from '../../auth/auth-api.service';

interface MenuItem {
  labelKey: string;
  icon: string;
  route?: string;
  badge?: number;
  children?: MenuItem[];
}

interface MenuSection {
  titleKey?: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'})
export class SidebarComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly i18nService = inject(I18nService);
  private readonly authTokenService = inject(AuthTokenService);
  private readonly authIdentityService = inject(AuthIdentityService);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  
  collapsed = this.dashboardService.sidebarCollapsed;
  currentRole = this.dashboardService.currentRole;
  language = this.i18nService.language;

  openAccordions = signal<Record<string, boolean>>({});
  isUserPanelOpen = signal(false);

  toggleAccordion(labelKey: string) {
    this.openAccordions.update((prev: Record<string, boolean>) => ({
      ...prev,
      [labelKey]: !prev[labelKey]
    }));
  }

  isAccordionOpen(labelKey: string): boolean {
    return !!this.openAccordions()[labelKey];
  }

  userInitials = computed(() => {
    const username = this.authIdentityService.username()?.trim();
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    return this.currentRole().substring(0, 2).toUpperCase();
  });

  username = computed(() => this.authIdentityService.username() ?? 'Unknown');
  roleLabel = computed(() => {
    const role = this.authIdentityService.primaryRole() ?? 'OWNER';
    const roleLabels: Record<string, string> = {
      SUPER_ADMIN: 'Superuser',
      OWNER: 'Owner',
      TENANT_ADMIN: 'Tenant Admin',
      TEACHER: 'Teacher',
    };
    return roleLabels[role] ?? role.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
  });

  isRtl = computed(() => this.language() === 'ar');

  t(text: string): string {
    return this.i18nService.t(text);
  }

  async logout(): Promise<void> {
    const role = this.currentRole();
    this.isUserPanelOpen.set(false);
    await this.authApi.logout();
    this.authTokenService.clearToken();
    this.authIdentityService.clearIdentity();
    this.dashboardService.returnUrl.set(null);
    this.router.navigate([`/${role}/login`]);
  }

  toggleUserPanel(): void {
    this.isUserPanelOpen.update((open) => !open);
  }

  menuSections = computed<MenuSection[]>(() => {
    const role = this.currentRole();
    const pendingOrders = this.dashboardService.pendingSubscriptionOrdersCount();
    
    switch (role) {
      case 'owner':
        return [
          {
            titleKey: 'sidebar.section.businessCore',
            items: [
              { labelKey: 'sidebar.item.dashboard', icon: 'dashboard', route: '/owner/overview' },
              {
                labelKey: 'sidebar.item.tenants',
                icon: 'business',
                children: [
                  { labelKey: 'sidebar.item.webUsers', icon: '', route: '/owner/web-users' },
                  { labelKey: 'sidebar.item.platformTenant', icon: '', route: '/owner/tenants' },
                ],
              },
              { labelKey: 'sidebar.item.plans', icon: 'layers', route: '/owner/plans' },
              { 
                labelKey: 'sidebar.item.subscriptions', 
                icon: 'card_membership', 
                badge: pendingOrders,
                children: [
                  { labelKey: 'sidebar.item.viewSubscriptions', icon: '', route: '/owner/subscriptions' },
                  { labelKey: 'sidebar.item.subscriptionTemplates', icon: '', route: '/owner/subscriptions/templates' },
                  { labelKey: 'sidebar.item.subscriptionOrders', icon: '', route: '/owner/subscriptions/orders', badge: pendingOrders }
                ]
              },
              { labelKey: 'sidebar.item.billing', icon: 'receipt_long', route: '/owner/billing' },
            ]
          },
          {
            titleKey: 'sidebar.section.productManagement',
            items: [
              { labelKey: 'sidebar.item.modules', icon: 'extension', route: '/owner/modules' },
              { labelKey: 'sidebar.item.usageAnalytics', icon: 'insights', route: '/owner/analytics' },
            ]
          },
          {
            titleKey: 'sidebar.section.operations',
            items: [
              { labelKey: 'sidebar.item.provisioning', icon: 'cloud_upload', route: '/owner/provisioning' },
              { labelKey: 'sidebar.item.integrations', icon: 'hub', route: '/owner/integrations' },
              { labelKey: 'sidebar.item.monitoring', icon: 'monitor_heart', route: '/owner/monitoring' },
            ]
          },
          {
            titleKey: 'sidebar.section.governance',
            items: [
              { labelKey: 'sidebar.item.platformUsers', icon: 'manage_accounts', route: '/owner/users' },
              { labelKey: 'sidebar.item.security', icon: 'security', route: '/owner/security' },
              { labelKey: 'sidebar.item.auditLogs', icon: 'history_edu', route: '/owner/audit' },
              { labelKey: 'sidebar.item.compliance', icon: 'gavel', route: '/owner/compliance' },
            ]
          },
          {
            titleKey: 'sidebar.section.system',
            items: [
              { labelKey: 'sidebar.item.notifications', icon: 'notifications', route: '/owner/notifications' },
              { labelKey: 'sidebar.item.platformSettings', icon: 'settings', route: '/owner/settings' },
              { labelKey: 'sidebar.item.webSettings', icon: 'public', route: '/owner/web-settings' },
              { labelKey: 'sidebar.item.questionBank', icon: 'quiz', route: '/owner/test' },
            ]
          }
        ];
      case 'tenant':
        return [
          {
            titleKey: 'sidebar.section.main',
            items: [
              { labelKey: 'sidebar.item.overview', icon: 'dashboard', route: '/tenant/overview' },
              { labelKey: 'sidebar.item.students', icon: 'school', route: '/tenant/students' },
              { labelKey: 'sidebar.item.teachers', icon: 'person_outline', route: '/tenant/teachers' },
              { labelKey: 'sidebar.item.groupsClasses', icon: 'groups', route: '/tenant/groups' },
            ]
          },
          {
            titleKey: 'sidebar.section.academic',
            items: [
              { labelKey: 'sidebar.item.schedule', icon: 'calendar_today', route: '/tenant/schedule' },
              { labelKey: 'sidebar.item.attendance', icon: 'fact_check', route: '/tenant/attendance' },
              { labelKey: 'sidebar.item.examsGrades', icon: 'assignment', route: '/tenant/exams' },
            ]
          },
          {
            titleKey: 'sidebar.section.financeAdmin',
            items: [
              { labelKey: 'sidebar.item.billing', icon: 'receipt_long', route: '/tenant/billing' },
              { labelKey: 'sidebar.item.reports', icon: 'bar_chart', route: '/tenant/reports' },
              { labelKey: 'sidebar.item.settings', icon: 'settings', route: '/tenant/settings' },
            ]
          },
          {
            titleKey: 'sidebar.section.development',
            items: [
              { labelKey: 'sidebar.item.designSystem', icon: 'palette', route: '/design-system' },
            ]
          }
        ];
      case 'teacher':
        return [
          {
            titleKey: 'sidebar.section.main',
            items: [
              { labelKey: 'sidebar.item.overview', icon: 'dashboard', route: '/teacher/overview' },
              { labelKey: 'sidebar.item.mySchedule', icon: 'calendar_month', route: '/teacher/schedule' },
              { labelKey: 'sidebar.item.myGroups', icon: 'groups', route: '/teacher/groups' },
              { labelKey: 'sidebar.item.attendance', icon: 'fact_check', route: '/teacher/attendance' },
              { labelKey: 'sidebar.item.examsGrades', icon: 'assignment_turned_in', route: '/teacher/grades' },
              { labelKey: 'sidebar.item.messages', icon: 'chat', route: '/teacher/messages' },
              { labelKey: 'sidebar.item.profile', icon: 'person', route: '/teacher/profile' },
            ]
          }
        ];
      default:
        return [];
    }
  });
}
