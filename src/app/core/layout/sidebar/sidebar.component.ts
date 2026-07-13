import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, type IsActiveMatchOptions } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../services/dashboard.service';
import { I18nService } from '../../services/i18n.service';
import { AuthTokenService } from '../../auth/auth-token.service';
import { AuthIdentityService } from '../../auth/auth-identity.service';
import { AuthApiService } from '../../auth/auth-api.service';
import { TenantImpersonationService } from '../../auth/tenant-impersonation.service';
import { TenantHostContextService } from '../../auth/tenant-host-context.service';

interface MenuItem {
  labelKey: string;
  icon: string;
  route?: string;
  permission?: string;
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
  private readonly tenantImpersonationService = inject(TenantImpersonationService);
  private readonly tenantHostContext = inject(TenantHostContextService);
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

  isAccordionExpanded(item: MenuItem): boolean {
    return this.isAccordionOpen(item.labelKey);
  }

  hasActiveChild(item: MenuItem): boolean {
    return item.children?.some((child) => this.isRouteActive(child.route)) ?? false;
  }

  isRouteActive(route?: string): boolean {
    if (!route) {
      return false;
    }

    return this.router.isActive(route, this.routeActiveOptions(route));
  }

  private routeActiveOptions(route: string): IsActiveMatchOptions {
    return {
      paths: route === '/tenant/educational-stages' ? 'exact' : 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    };
  }

  userInitials = computed(() => {
    const username = this.authIdentityService.username()?.trim();
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    const role = this.currentRole();
    return role ? role.substring(0, 2).toUpperCase() : 'U';
  });

  username = computed(() => this.authIdentityService.username() ?? 'Unknown');
  roleLabel = computed(() => {
    const role = this.authIdentityService.primaryRole() ?? 'UNKNOWN';
    const roleLabels: Record<string, string> = {
      SUPER_ADMIN: 'Superuser',
      OWNER: 'Owner',
      TENANT_ADMIN: 'Tenant Admin',
      TEACHER: 'Teacher',
      STUDENT: 'Student',
      PARENT: 'Parent',
    };
    return roleLabels[role] ?? role.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
  });

  profileRoute = computed(() => {
    switch (this.currentRole()) {
      case 'tenant':
        return '/tenant/profile';
      case 'teacher':
        return '/teacher/profile';
      default:
        return null;
    }
  });

  isRtl = computed(() => this.language() === 'ar');

  t(text: string): string {
    return this.i18nService.t(text);
  }

  async logout(): Promise<void> {
    const role = this.currentRole() ?? this.dashboardService.resolveWorkspaceFromUrl(this.router.url) ?? 'owner';
    this.isUserPanelOpen.set(false);
    await this.authApi.logout();
    this.authTokenService.clearToken();
    this.authIdentityService.clearIdentity();
    this.tenantImpersonationService.clear();
    this.dashboardService.returnUrl.set(null);
    this.router.navigate([this.tenantHostContext.isTenantHost() ? '/' : `/${role}/login`]);
  }

  toggleUserPanel(): void {
    this.isUserPanelOpen.update((open) => !open);
  }

  closeUserPanel(): void {
    this.isUserPanelOpen.set(false);
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
        return this.filterTenantMenu([
          {
            titleKey: 'sidebar.section.main',
            items: [
              { labelKey: 'sidebar.item.overview', icon: 'dashboard', route: '/tenant/overview' },
            ]
          },
          {
            titleKey: 'sidebar.section.users',
            items: [
              { labelKey: 'sidebar.item.students', icon: 'school', route: '/tenant/students', permission: 'tenant.students.view' },
              { labelKey: 'sidebar.item.parents', icon: 'family_restroom', route: '/tenant/parents', permission: 'tenant.students.view' },
              { labelKey: 'sidebar.item.teachers', icon: 'person', route: '/tenant/teachers', permission: 'tenant.teachers.view' },
              { labelKey: 'sidebar.item.users', icon: 'manage_accounts', route: '/tenant/users', permission: 'tenant.users.view' },
            ]
          },
          {
            titleKey: 'sidebar.section.academic',
            items: [
              { labelKey: 'sidebar.item.groupsClasses', icon: 'groups', route: '/tenant/groups', permission: 'tenant.groups.view' },
              {
                labelKey: 'sidebar.item.basicEducation',
                icon: 'account_tree',
                children: [
                  { labelKey: 'sidebar.item.educationalStages', icon: 'account_tree', route: '/tenant/educational-stages', permission: 'tenant.basicEducation.view' },
                  { labelKey: 'sidebar.item.grades', icon: 'grades', route: '/tenant/grades', permission: 'tenant.grades.view' },
                  { labelKey: 'sidebar.item.subjects', icon: 'menu_book', route: '/tenant/subjects', permission: 'tenant.basicEducation.view' },
                ],
              },
              {
                labelKey: 'sidebar.item.universityEducation',
                icon: 'account_balance',
                children: [
                  { labelKey: 'sidebar.item.universities', icon: 'account_balance', route: '/tenant/universities', permission: 'tenant.universityEducation.view' },
                  { labelKey: 'sidebar.item.colleges', icon: 'school', route: '/tenant/colleges', permission: 'tenant.universityEducation.view' },
                  { labelKey: 'sidebar.item.universitySubjects', icon: 'menu_book', route: '/tenant/university-subjects', permission: 'tenant.universityEducation.view' },
                ],
              },
            ]
          },
          {
            titleKey: 'sidebar.section.attendance',
            items: [
              { labelKey: 'sidebar.item.schedule', icon: 'calendar_today', route: '/tenant/schedule', permission: 'tenant.attendance.view' },
              { labelKey: 'sidebar.item.attendance', icon: 'fact_check', route: '/tenant/attendance', permission: 'tenant.attendance.view' },
            ]
          },
          {
            titleKey: 'sidebar.section.examsEvaluation',
            items: [
              { labelKey: 'sidebar.item.examsGrades', icon: 'assignment', route: '/tenant/exams', permission: 'tenant.exams.manage' },
              { labelKey: 'sidebar.item.questionsBank', icon: 'quiz', route: '/tenant/questions-bank', permission: 'tenant.questionBank.manage' },
              {
                labelKey: 'sidebar.item.examEvaluation',
                icon: 'grades',
                permission: 'tenant.grades.view',
                children: [
                  { labelKey: 'sidebar.item.examEvaluationList', icon: '', route: '/tenant/exam-evaluation', permission: 'tenant.grades.view' },
                  { labelKey: 'sidebar.item.homeWorkEvaluation', icon: '', route: '/tenant/evaluation/home-work', permission: 'tenant.grades.view' },
                  { labelKey: 'sidebar.item.assessmentEvaluation', icon: '', route: '/tenant/evaluation/assessment', permission: 'tenant.grades.view' },
                ],
              },
            ]
          },
          {
            titleKey: 'sidebar.section.financeAdmin',
            items: [
              { labelKey: 'sidebar.item.billing', icon: 'receipt_long', route: '/tenant/billing', permission: 'tenant.billing.view' },
            ]
          },
          {
            titleKey: 'sidebar.section.settings',
            items: [
              { labelKey: 'sidebar.item.reports', icon: 'bar_chart', route: '/tenant/reports', permission: 'tenant.reports.view' },
              { labelKey: 'sidebar.item.lms', icon: 'public', route: '/tenant/lms-settings', permission: 'tenant.settings.manage' },
              { labelKey: 'sidebar.item.platformSettings', icon: 'settings', route: '/tenant/settings', permission: 'tenant.settings.manage' },
              { labelKey: 'sidebar.item.rolesPermissions', icon: 'admin_panel_settings', route: '/tenant/users/roles-permissions', permission: 'tenant.roles.view' },
              { labelKey: 'sidebar.item.rooms', icon: 'rooms', route: '/tenant/rooms', permission: 'tenant.rooms.view' },
            ]
          }
        ]);
      case 'teacher':
        return [
          {
            titleKey: 'sidebar.section.main',
            items: [
              { labelKey: 'sidebar.item.overview', icon: 'dashboard', route: '/teacher/overview' },
              { labelKey: 'sidebar.item.mySchedule', icon: 'calendar_month', route: '/teacher/schedule' },
              { labelKey: 'sidebar.item.myGroups', icon: 'groups', route: '/teacher/groups' },
              { labelKey: 'sidebar.item.attendance', icon: 'fact_check', route: '/teacher/attendance' },
              { labelKey: 'sidebar.item.examsGrades', icon: 'assignment_turned_in', route: '/teacher/exams' },
              {
                labelKey: 'sidebar.item.examEvaluation',
                icon: 'fact_check',
                children: [
                  { labelKey: 'sidebar.item.examsEvaluation', icon: '', route: '/teacher/evaluation/exams' },
                  { labelKey: 'sidebar.item.homeWorkEvaluation', icon: '', route: '/teacher/evaluation/home-work' },
                  { labelKey: 'sidebar.item.sessionAssessment', icon: '', route: '/teacher/evaluation/session-assessment' },
                ],
              },
              { labelKey: 'sidebar.item.messages', icon: 'chat', route: '/teacher/messages' },
              { labelKey: 'sidebar.item.profile', icon: 'person', route: '/teacher/profile' },
            ]
          }
        ];
      case 'student':
        return [
          {
            titleKey: 'sidebar.section.main',
            items: [
              { labelKey: 'sidebar.item.overview', icon: 'dashboard', route: '/student/overview' },
              { labelKey: 'sidebar.item.schedule', icon: 'calendar_today', route: '/student/schedule' },
              { labelKey: 'sidebar.item.myCourses', icon: 'school', route: '/student/my-courses' },
              { labelKey: 'sidebar.item.myGroups', icon: 'groups', route: '/student/my-groups' },
              { labelKey: 'sidebar.item.examsGrades', icon: 'assignment', route: '/student/exams' },
              { labelKey: 'sidebar.item.homeWork', icon: 'assignment_turned_in', route: '/student/home-work' },
              {
                labelKey: 'sidebar.item.examEvaluation',
                icon: 'fact_check',
                children: [
                  { labelKey: 'sidebar.item.examsEvaluation', icon: '', route: '/student/evaluation/exams' },
                  { labelKey: 'sidebar.item.homeWorkEvaluation', icon: '', route: '/student/evaluation/home-work' },
                ],
              },
              { labelKey: 'sidebar.item.billing', icon: 'receipt_long', route: '/student/billing' },
            ],
          },
        ];
      case 'parent':
        return [
          {
            titleKey: 'sidebar.section.main',
            items: [
              { labelKey: 'sidebar.item.overview', icon: 'dashboard', route: '/parent/overview' },
              { labelKey: 'sidebar.item.childs', icon: 'school', route: '/parent/students' },
              { labelKey: 'sidebar.item.attendance', icon: 'fact_check', route: '/parent/attendance' },
              {
                labelKey: 'sidebar.item.examEvaluation',
                icon: 'fact_check',
                children: [
                  { labelKey: 'sidebar.item.examEvaluationList', icon: '', route: '/parent/exam-evaluation' },
                  { labelKey: 'sidebar.item.homeWorkEvaluation', icon: '', route: '/parent/home-work-evaluation' },
                  { labelKey: 'sidebar.item.sessionAssessment', icon: '', route: '/parent/session-assessment' },
                ],
              },
              { labelKey: 'sidebar.item.billing', icon: 'receipt_long', route: '/parent/billing' },
            ],
          },
        ];
      default:
        return [];
    }
  });

  private filterTenantMenu(sections: MenuSection[]): MenuSection[] {
    return sections
      .map((section) => ({
        ...section,
        items: section.items
          .map((item) => this.filterTenantItem(item))
          .filter((item): item is MenuItem => item !== null),
      }))
      .filter((section) => section.items.length > 0);
  }

  private filterTenantItem(item: MenuItem): MenuItem | null {
    const children = item.children
      ?.map((child) => this.filterTenantItem(child))
      .filter((child): child is MenuItem => child !== null);
    const allowed = !item.permission || this.authIdentityService.hasPermission(item.permission);
    if (!allowed && (!children || children.length === 0)) {
      return null;
    }
    return { ...item, children };
  }
}
