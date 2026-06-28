import { Injectable, inject } from '@angular/core';
import { TenantPermissionService } from '../../auth/tenant-permission.service';

export interface DashboardAction {
  id: string;
  labelKey: string;
  descriptionKey: string;
  keywords: string[];
  categoryKey: string;
  icon: string;
  route: string;
  requiredPermission?: string;
  requiredPermissions?: string[];
}

@Injectable({ providedIn: 'root' })
export class DashboardActionsRegistry {
  private readonly permissions = inject(TenantPermissionService);

  private readonly actions: DashboardAction[] = [
    action('overview', 'Overview', 'Open system overview', 'Main', 'dashboard', '/tenant/overview', ['overview', 'dashboard', 'نظرة', 'لوحة']),
    action('students', 'Students', 'Open student records', 'Academic', 'school', '/tenant/students', ['students', 'طلاب'], 'tenant.students.view'),
    action('students.create', 'Add Student', 'Create a new student', 'Academic', 'person_add', '/tenant/students/create', ['add student', 'new student', 'طالب'], 'tenant.students.manage'),
    action('teachers', 'Teachers', 'Open teacher records', 'Academic', 'co_present', '/tenant/teachers', ['teachers', 'معلم'], 'tenant.teachers.view'),
    action('teachers.create', 'Add Teacher', 'Create a new teacher', 'Academic', 'person_add_alt_1', '/tenant/teachers/create', ['add teacher', 'new teacher', 'معلم'], 'tenant.teachers.manage'),
    action('groups', 'Groups', 'Open groups and classes', 'Academic', 'groups', '/tenant/groups', ['groups', 'classes', 'مجموعات'], 'tenant.groups.view'),
    action('groups.create', 'Create Group', 'Create a new group or class', 'Academic', 'group_add', '/tenant/groups/create', ['create group', 'class', 'مجموعة'], 'tenant.groups.manage'),
    action('rooms', 'Rooms', 'Open room management', 'Academic', 'location_on', '/tenant/rooms', ['rooms', 'قاعات'], 'tenant.rooms.view'),
    action('rooms.create', 'Create Room', 'Create a new room', 'Academic', 'add_location_alt', '/tenant/rooms/create', ['create room', 'قاعة'], 'tenant.rooms.manage'),
    action('basic.stages', 'Educational Stages', 'Open basic education stages', 'Basic Education', 'account_tree', '/tenant/educational-stages', ['basic education', 'stages', 'مراحل'], 'tenant.basicEducation.view'),
    action('basic.stages.create', 'Create Stage', 'Create a basic education stage', 'Basic Education', 'add_box', '/tenant/educational-stages/create', ['create stage', 'مرحلة'], 'tenant.basicEducation.manage'),
    action('basic.subjects', 'Subjects', 'Open basic education subjects', 'Basic Education', 'menu_book', '/tenant/subjects', ['subjects', 'مواد'], 'tenant.basicEducation.view'),
    action('basic.subjects.create', 'Create Subject', 'Create a basic education subject', 'Basic Education', 'post_add', '/tenant/subjects/create', ['create subject', 'مادة'], 'tenant.basicEducation.manage'),
    action('universities', 'Universities', 'Open universities', 'University Education', 'account_balance', '/tenant/universities', ['universities', 'جامعات'], 'tenant.universityEducation.view'),
    action('universities.create', 'Create University', 'Create a university', 'University Education', 'add_business', '/tenant/universities/create', ['create university', 'جامعة'], 'tenant.universityEducation.manage'),
    action('colleges', 'Colleges', 'Open colleges', 'University Education', 'domain', '/tenant/colleges', ['colleges', 'كليات'], 'tenant.universityEducation.view'),
    action('colleges.create', 'Create College', 'Create a college', 'University Education', 'add_home_work', '/tenant/colleges/create', ['create college', 'كلية'], 'tenant.universityEducation.manage'),
    action('university.subjects', 'University Subjects', 'Open university subjects', 'University Education', 'library_books', '/tenant/university-subjects', ['university subjects', 'مواد جامعية'], 'tenant.universityEducation.view'),
    action('attendance', 'Attendance', 'Open attendance records', 'Academic', 'fact_check', '/tenant/attendance', ['attendance', 'حضور'], 'tenant.attendance.view'),
    action('schedule', 'Schedule', 'Open tenant schedule', 'Academic', 'calendar_month', '/tenant/schedule', ['schedule', 'جدول'], 'tenant.attendance.view'),
    action('exams', 'Exams', 'Open exams', 'Academic', 'assignment', '/tenant/exams', ['exams', 'اختبارات'], 'tenant.exams.manage'),
    action('grades', 'Grades', 'Open grades', 'Academic', 'star', '/tenant/grades', ['grades', 'درجات'], 'tenant.grades.view'),
    action('grades.create', 'Create Grade', 'Create a grade', 'Academic', 'add_circle', '/tenant/grades/create', ['create grade', 'درجة'], 'tenant.grades.manage'),
    action('questions', 'Questions Bank', 'Open questions bank', 'Academic', 'quiz', '/tenant/questions-bank', ['questions', 'bank', 'أسئلة'], 'tenant.questionBank.manage'),
    action('billing', 'Billing', 'Open tenant billing', 'Finance', 'receipt_long', '/tenant/billing', ['billing', 'invoices', 'فواتير'], 'tenant.billing.view'),
    action('reports', 'Reports', 'Open reports', 'Finance', 'bar_chart', '/tenant/reports', ['reports', 'تقارير'], 'tenant.reports.view'),
    action('users', 'Users', 'Open dashboard users', 'Users', 'manage_accounts', '/tenant/users', ['users', 'مستخدمين'], 'tenant.users.view'),
    action('users.create', 'Create User', 'Create dashboard user', 'Users', 'person_add', '/tenant/users/create', ['create user', 'مستخدم'], 'tenant.users.manage'),
    action('roles', 'Roles & Permissions', 'Open roles and permissions', 'Users', 'admin_panel_settings', '/tenant/users/roles-permissions', ['roles', 'permissions', 'صلاحيات'], 'tenant.roles.view'),
    action('roles.create', 'Create Role', 'Create dashboard role', 'Users', 'add_moderator', '/tenant/users/roles-permissions/create', ['create role', 'دور'], 'tenant.roles.manage'),
    action('settings', 'Platform Settings', 'Open platform settings', 'Settings', 'settings', '/tenant/settings', ['settings', 'إعدادات'], 'tenant.settings.manage'),
  ];

  availableActions(query = ''): DashboardAction[] {
    const normalizedQuery = query.trim().toLowerCase();
    return this.actions
      .filter((candidate) => this.isPermitted(candidate))
      .filter((candidate) => !normalizedQuery || this.matches(candidate, normalizedQuery));
  }

  private isPermitted(action: DashboardAction): boolean {
    if (action.requiredPermissions?.length) {
      return this.permissions.hasAllPermissions(action.requiredPermissions);
    }
    return this.permissions.hasPermission(action.requiredPermission);
  }

  private matches(action: DashboardAction, query: string): boolean {
    return [
      action.labelKey,
      action.descriptionKey,
      action.categoryKey,
      ...action.keywords,
    ].some((value) => value.toLowerCase().includes(query));
  }
}

function action(
  id: string,
  labelKey: string,
  descriptionKey: string,
  categoryKey: string,
  icon: string,
  route: string,
  keywords: string[],
  requiredPermission?: string,
): DashboardAction {
  return { id, labelKey, descriptionKey, categoryKey, icon, route, keywords, requiredPermission };
}
