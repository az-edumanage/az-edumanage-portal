import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { DashboardService, WorkspaceRole } from '../../services/dashboard.service';
import { I18nService } from '../../services/i18n.service';
import { AuthTokenService } from '../../auth/auth-token.service';
import { AuthIdentityService } from '../../auth/auth-identity.service';
import { AuthApiService } from '../../auth/auth-api.service';
import { TenantImpersonationService } from '../../auth/tenant-impersonation.service';
import { TenantHostContextService } from '../../auth/tenant-host-context.service';
import { TENANT_MODULES } from '../../auth/tenant-module-entitlements';

const educationRoutes = ['/tenant/educational-stages', '/tenant/grades', '/tenant/subjects'];
const universityEducationRoutes = ['/tenant/universities', '/tenant/colleges', '/tenant/university-subjects'];

describe('SidebarComponent', () => {
  let currentRole: ReturnType<typeof signal<WorkspaceRole>>;
  let grantedPermissions: Set<string>;
  let isTenantHost: ReturnType<typeof signal<boolean>>;
  let enabledModules: Set<string>;

  beforeEach(() => {
    currentRole = signal<WorkspaceRole>('tenant');
    isTenantHost = signal(false);
    grantedPermissions = new Set([
      'tenant.students.view',
      'tenant.teachers.view',
      'tenant.groups.view',
      'tenant.rooms.view',
      'tenant.basicEducation.view',
      'tenant.universityEducation.view',
      'tenant.attendance.view',
      'tenant.exams.manage',
      'tenant.grades.view',
      'tenant.questionBank.manage',
      'tenant.billing.view',
      'tenant.reports.view',
      'tenant.settings.manage',
      'tenant.users.view',
      'tenant.roles.view',
    ]);
    enabledModules = new Set(Object.values(TENANT_MODULES));

    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        {
          provide: DashboardService,
          useValue: {
            sidebarCollapsed: signal(false),
            currentRole,
            pendingSubscriptionOrdersCount: signal(0),
            returnUrl: signal(null),
            resolveWorkspaceFromUrl: (url: string) => url.startsWith('/tenant') ? 'tenant' : null,
          },
        },
        { provide: I18nService, useValue: { language: signal<'en' | 'ar'>('en'), t: (key: string) => key } },
        { provide: AuthTokenService, useValue: { clearToken: vi.fn() } },
        {
          provide: AuthIdentityService,
          useValue: {
            username: signal('tenant'),
            primaryRole: signal('WEB_USER'),
            clearIdentity: vi.fn(),
            hasPermission: (permission: string) => grantedPermissions.has(permission),
            hasModule: (moduleCode: string) => enabledModules.has(moduleCode),
            hasAllModules: (moduleCodes: readonly string[]) => moduleCodes.every((moduleCode) => enabledModules.has(moduleCode)),
          },
        },
        { provide: AuthApiService, useValue: { logout: vi.fn().mockResolvedValue(undefined) } },
        { provide: TenantImpersonationService, useValue: { clear: vi.fn() } },
        { provide: TenantHostContextService, useValue: { isTenantHost } },
      ],
    });
  });

  it('returns only tenant menu sections for tenant workspace', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const sections = fixture.componentInstance.menuSections();
    const routes = allRoutes(sections);
    const topLevelRoutes = sections.flatMap((section) => section.items.map((item) => item.route).filter(Boolean));
    const basicEducation = sections
      .flatMap((section) => section.items)
      .find((item) => item.labelKey === 'sidebar.item.basicEducation');
    const mainItems = sections.find((section) => section.titleKey === 'sidebar.section.main')?.items ?? [];
    const usersItems = sections.find((section) => section.titleKey === 'sidebar.section.users')?.items ?? [];
    const academicItems = sections.find((section) => section.titleKey === 'sidebar.section.academic')?.items ?? [];
    const attendanceItems = sections.find((section) => section.titleKey === 'sidebar.section.attendance')?.items ?? [];
    const examsEvaluationItems = sections.find((section) => section.titleKey === 'sidebar.section.examsEvaluation')?.items ?? [];
    const financeItems = sections.find((section) => section.titleKey === 'sidebar.section.financeAdmin')?.items ?? [];
    const settingsItems = sections.find((section) => section.titleKey === 'sidebar.section.settings')?.items ?? [];
    const universityEducation = academicItems.find((item) => item.labelKey === 'sidebar.item.universityEducation');

    expect(routes).toContain('/tenant/overview');
    expect(routes).toContain('/tenant/platform-user-guide');
    expect(routes).toContain('/tenant/students');
    expect(routes).toContain('/tenant/parents');
    expect(routes).toContain('/tenant/settings');
    expect(routes).toContain('/tenant/lms-settings');
    expect(routes).not.toContain('/owner/overview');
    expect(sections.findIndex((section) => section.titleKey === 'sidebar.section.users'))
      .toBe(sections.findIndex((section) => section.titleKey === 'sidebar.section.main') + 1);
    expect(sections.findIndex((section) => section.titleKey === 'sidebar.section.academic'))
      .toBe(sections.findIndex((section) => section.titleKey === 'sidebar.section.users') + 1);
    expect(sections.findIndex((section) => section.titleKey === 'sidebar.section.attendance'))
      .toBe(sections.findIndex((section) => section.titleKey === 'sidebar.section.academic') + 1);
    expect(sections.findIndex((section) => section.titleKey === 'sidebar.section.examsEvaluation'))
      .toBe(sections.findIndex((section) => section.titleKey === 'sidebar.section.attendance') + 1);

    expect(basicEducation?.route).toBeUndefined();
    expect(basicEducation?.children?.map((child) => child.route)).toEqual(educationRoutes);
    expect(mainItems.map((item) => item.labelKey)).not.toContain('sidebar.item.users');
    expect(mainItems.map((item) => item.labelKey)).not.toContain('sidebar.item.rooms');
    expect(mainItems.map((item) => item.labelKey)).not.toContain('sidebar.item.groupsClasses');
    expect(mainItems.map((item) => item.labelKey)).not.toContain('sidebar.item.basicEducation');
    expect(mainItems.map((item) => item.labelKey)).not.toContain('sidebar.item.universityEducation');
    expect(mainItems.map((item) => [item.labelKey, item.route])).toEqual([
      ['sidebar.item.overview', '/tenant/overview'],
      ['sidebar.item.platformUserGuide', '/tenant/platform-user-guide'],
    ]);
    expect(usersItems.map((item) => [item.labelKey, item.route])).toEqual([
      ['sidebar.item.students', '/tenant/students'],
      ['sidebar.item.parents', '/tenant/parents'],
      ['sidebar.item.teachers', '/tenant/teachers'],
      ['sidebar.item.users', '/tenant/users'],
    ]);
    expect(academicItems.slice(0, 3).map((item) => [item.labelKey, item.route])).toEqual([
      ['sidebar.item.groupsClasses', '/tenant/groups'],
      ['sidebar.item.basicEducation', undefined],
      ['sidebar.item.universityEducation', undefined],
    ]);
    expect(academicItems.findIndex((item) => item.labelKey === 'sidebar.item.universityEducation'))
      .toBe(academicItems.findIndex((item) => item.labelKey === 'sidebar.item.basicEducation') + 1);
    expect(academicItems.map((item) => item.labelKey)).not.toContain('sidebar.item.schedule');
    expect(academicItems.map((item) => item.labelKey)).not.toContain('sidebar.item.attendance');
    expect(academicItems.map((item) => item.labelKey)).not.toContain('sidebar.item.examsGrades');
    expect(academicItems.map((item) => item.labelKey)).not.toContain('sidebar.item.questionsBank');
    expect(academicItems.map((item) => item.labelKey)).not.toContain('sidebar.item.examEvaluation');
    expect(attendanceItems.map((item) => [item.labelKey, item.route])).toEqual([
      ['sidebar.item.schedule', '/tenant/schedule'],
      ['sidebar.item.attendance', '/tenant/attendance'],
    ]);
    expect(examsEvaluationItems.map((item) => [item.labelKey, item.route])).toEqual([
      ['sidebar.item.examsGrades', '/tenant/exams'],
      ['sidebar.item.questionsBank', '/tenant/questions-bank'],
      ['sidebar.item.examEvaluation', undefined],
    ]);
    expect(examsEvaluationItems.find((item) => item.labelKey === 'sidebar.item.examEvaluation')?.children?.map((child) => [child.labelKey, child.route])).toEqual([
      ['sidebar.item.examEvaluationList', '/tenant/exam-evaluation'],
      ['sidebar.item.homeWorkEvaluation', '/tenant/evaluation/home-work'],
      ['sidebar.item.assessmentEvaluation', '/tenant/evaluation/assessment'],
    ]);
    expect(financeItems.map((item) => [item.labelKey, item.route])).toEqual([
      ['sidebar.item.billing', '/tenant/billing'],
    ]);
    expect(settingsItems.map((item) => [item.labelKey, item.route])).toEqual([
      ['sidebar.item.reports', '/tenant/reports'],
      ['sidebar.item.lms', '/tenant/lms-settings'],
      ['sidebar.item.platformSettings', '/tenant/settings'],
      ['sidebar.item.rolesPermissions', '/tenant/users/roles-permissions'],
      ['sidebar.item.rooms', '/tenant/rooms'],
    ]);
    expect(sections.some((section) => section.titleKey === 'sidebar.section.development')).toBe(false);
    expect(routes).not.toContain('/design-system');
    expect(universityEducation?.route).toBeUndefined();
    expect(universityEducation?.children?.map((child) => child.route)).toEqual(universityEducationRoutes);
    educationRoutes.filter((route) => route !== '/tenant/grades').forEach((route) => expect(topLevelRoutes).not.toContain(route));
    universityEducationRoutes.forEach((route) => expect(topLevelRoutes).not.toContain(route));
  });

  it('uses grouped teacher evaluation routes under Evaluation', () => {
    currentRole.set('teacher');

    const fixture = TestBed.createComponent(SidebarComponent);
    const sections = fixture.componentInstance.menuSections();
    const examsItem = sections
      .flatMap((section) => section.items)
      .find((item) => item.labelKey === 'sidebar.item.examsGrades');
    const evaluationItem = sections
      .flatMap((section) => section.items)
      .find((item) => item.labelKey === 'sidebar.item.examEvaluation');

    expect(examsItem?.route).toBe('/teacher/exams');
    expect(evaluationItem?.route).toBeUndefined();
    expect(evaluationItem?.children?.map((child) => [child.labelKey, child.route])).toEqual([
      ['sidebar.item.examsEvaluation', '/teacher/evaluation/exams'],
      ['sidebar.item.homeWorkEvaluation', '/teacher/evaluation/home-work'],
      ['sidebar.item.sessionAssessment', '/teacher/evaluation/session-assessment'],
    ]);
  });

  it('hides tenant features that are not included in the active plan', () => {
    enabledModules = new Set([TENANT_MODULES.studentsManagement]);

    const fixture = TestBed.createComponent(SidebarComponent);
    const routes = allRoutes(fixture.componentInstance.menuSections());

    expect(routes).toContain('/tenant/students');
    expect(routes).not.toContain('/tenant/parents');
    expect(routes).not.toContain('/tenant/exams');
    expect(routes).not.toContain('/tenant/questions-bank');
    expect(routes).not.toContain('/tenant/reports');
    expect(routes).not.toContain('/tenant/lms-settings');
  });

  it('hides Parent and Attendance when Students Management is unavailable', () => {
    enabledModules = new Set([TENANT_MODULES.parentPortal]);

    const fixture = TestBed.createComponent(SidebarComponent);
    const routes = allRoutes(fixture.componentInstance.menuSections());

    expect(routes).not.toContain('/tenant/students');
    expect(routes).not.toContain('/tenant/parents');
    expect(routes).not.toContain('/tenant/attendance');
    expect(routes).toContain('/tenant/schedule');
  });

  it('uses grouped student evaluation routes under Evaluation', () => {
    currentRole.set('student');

    const fixture = TestBed.createComponent(SidebarComponent);
    const items = fixture.componentInstance.menuSections()[0]?.items ?? [];
    const evaluationItem = items.find((item) => item.labelKey === 'sidebar.item.examEvaluation');

    expect(items.map((item) => [item.labelKey, item.route])).toEqual([
      ['sidebar.item.overview', '/student/overview'],
      ['sidebar.item.schedule', '/student/schedule'],
      ['sidebar.item.myCourses', '/student/my-courses'],
      ['sidebar.item.myGroups', '/student/my-groups'],
      ['sidebar.item.examsGrades', '/student/exams'],
      ['sidebar.item.homeWork', '/student/home-work'],
      ['sidebar.item.examEvaluation', undefined],
      ['sidebar.item.billing', '/student/billing'],
    ]);
    expect(evaluationItem?.children?.map((child) => [child.labelKey, child.route])).toEqual([
      ['sidebar.item.examsEvaluation', '/student/evaluation/exams'],
      ['sidebar.item.homeWorkEvaluation', '/student/evaluation/home-work'],
    ]);
  });

  it.each([
    ['tenant.rooms.view', '/tenant/rooms'],
    ['tenant.basicEducation.view', '/tenant/educational-stages'],
    ['tenant.grades.view', '/tenant/exam-evaluation'],
    ['tenant.universityEducation.view', '/tenant/universities'],
    ['tenant.attendance.view', '/tenant/attendance'],
    ['tenant.reports.view', '/tenant/reports'],
    ['tenant.settings.manage', '/tenant/settings'],
  ])('shows %s sidebar target when the matching permission is granted', (permission, route) => {
    grantedPermissions = new Set([permission]);

    const fixture = TestBed.createComponent(SidebarComponent);
    const routes = allRoutes(fixture.componentInstance.menuSections());

    expect(routes).toContain(route);
  });

  it('toggles the Basic Education accordion without navigation', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const component = fixture.componentInstance;

    expect(component.isAccordionOpen('sidebar.item.basicEducation')).toBe(false);

    component.toggleAccordion('sidebar.item.basicEducation');

    expect(component.isAccordionOpen('sidebar.item.basicEducation')).toBe(true);

    component.toggleAccordion('sidebar.item.basicEducation');

    expect(component.isAccordionOpen('sidebar.item.basicEducation')).toBe(false);
  });

  it('toggles the University Education accordion without navigation', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const component = fixture.componentInstance;

    expect(component.isAccordionOpen('sidebar.item.universityEducation')).toBe(false);

    component.toggleAccordion('sidebar.item.universityEducation');

    expect(component.isAccordionOpen('sidebar.item.universityEducation')).toBe(true);

    component.toggleAccordion('sidebar.item.universityEducation');

    expect(component.isAccordionOpen('sidebar.item.universityEducation')).toBe(false);
  });

  it.each([
    ['/tenant/educational-stages', 'sidebar.item.educationalStages'],
    ['/tenant/grades', 'sidebar.item.grades'],
    ['/tenant/grades/create', 'sidebar.item.grades'],
    ['/tenant/subjects', 'sidebar.item.subjects'],
    ['/tenant/subjects/create', 'sidebar.item.subjects'],
  ])('detects the active education child without forcing the accordion open for %s', (currentUrl, activeLabelKey) => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'isActive').mockImplementation((url) => {
      const route = url.toString();
      return currentUrl === route || (
        route !== '/tenant/educational-stages'
        && currentUrl.startsWith(`${route}/`)
      );
    });
    const fixture = TestBed.createComponent(SidebarComponent);
    const basicEducation = fixture.componentInstance.menuSections()
      .flatMap((section) => section.items)
      .find((item) => item.labelKey === 'sidebar.item.basicEducation');
    const activeChild = basicEducation?.children?.find((child) => child.labelKey === activeLabelKey);

    expect(basicEducation).toBeDefined();
    expect(fixture.componentInstance.isAccordionExpanded(basicEducation!)).toBe(false);
    expect(fixture.componentInstance.hasActiveChild(basicEducation!)).toBe(true);
    expect(fixture.componentInstance.isRouteActive(activeChild?.route)).toBe(true);

    fixture.componentInstance.toggleAccordion('sidebar.item.basicEducation');

    expect(fixture.componentInstance.isAccordionExpanded(basicEducation!)).toBe(true);
  });

  it.each([
    ['/tenant/universities', 'sidebar.item.universities'],
    ['/tenant/colleges', 'sidebar.item.colleges'],
    ['/tenant/colleges/create', 'sidebar.item.colleges'],
    ['/tenant/university-subjects', 'sidebar.item.universitySubjects'],
    ['/tenant/university-subjects/create', 'sidebar.item.universitySubjects'],
  ])('detects the active university education child without forcing the accordion open for %s', (currentUrl, activeLabelKey) => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'isActive').mockImplementation((url) => {
      const route = url.toString();
      return currentUrl === route || currentUrl.startsWith(`${route}/`);
    });
    const fixture = TestBed.createComponent(SidebarComponent);
    const universityEducation = fixture.componentInstance.menuSections()
      .flatMap((section) => section.items)
      .find((item) => item.labelKey === 'sidebar.item.universityEducation');
    const activeChild = universityEducation?.children?.find((child) => child.labelKey === activeLabelKey);

    expect(universityEducation).toBeDefined();
    expect(fixture.componentInstance.isAccordionExpanded(universityEducation!)).toBe(false);
    expect(fixture.componentInstance.hasActiveChild(universityEducation!)).toBe(true);
    expect(fixture.componentInstance.isRouteActive(activeChild?.route)).toBe(true);
  });

  it.each([
    ['/tenant/subjects', 'sidebar.item.basicEducation'],
    ['/tenant/colleges', 'sidebar.item.universityEducation'],
  ])('highlights the accordion parent when a child route is active for %s', (currentUrl, parentLabelKey) => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'isActive').mockImplementation((url) => {
      const route = url.toString();
      return currentUrl === route || currentUrl.startsWith(`${route}/`);
    });
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();

    const parentButton = fixture.debugElement
      .queryAll(By.css('button'))
      .find((button) => (button.nativeElement as HTMLElement).textContent?.includes(parentLabelKey));

    expect(parentButton).toBeDefined();
    expect(parentButton?.classes['sidebar-accordion-active']).toBe(true);
    expect(parentButton?.classes['text-white']).toBe(true);
  });

  it('returns no menu sections for unresolved workspace', () => {
    currentRole.set(null);
    const fixture = TestBed.createComponent(SidebarComponent);

    expect(fixture.componentInstance.menuSections()).toEqual([]);
  });

  it('logs out to the tenant subdomain base URL', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    isTenantHost.set(true);
    const fixture = TestBed.createComponent(SidebarComponent);

    await fixture.componentInstance.logout();

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('logs out to the current route workspace login on platform hosts', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(SidebarComponent);

    await fixture.componentInstance.logout();

    expect(router.navigate).toHaveBeenCalledWith(['/tenant/login']);
  });

  it('shows a tenant Profile action in the footer account panel above Logout', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.componentInstance.toggleUserPanel();
    fixture.detectChanges();

    const panelLinks = fixture.debugElement.queryAll(By.css('a'));
    const profileLink = panelLinks.find((link) => (link.nativeElement as HTMLElement).textContent?.includes('sidebar.item.profile'));
    const logoutButton = fixture.debugElement
      .queryAll(By.css('button'))
      .find((button) => (button.nativeElement as HTMLElement).textContent?.includes('Logout'));

    expect(profileLink).toBeDefined();
    expect(profileLink?.attributes['href']).toBe('/tenant/profile');
    expect(logoutButton).toBeDefined();
  });
});

function allRoutes(sections: ReturnType<SidebarComponent['menuSections']>): string[] {
  return sections.flatMap((section) => section.items.flatMap((item) => [
    ...(item.route ? [item.route] : []),
    ...(item.children?.flatMap((child) => child.route ? [child.route] : []) ?? []),
  ]));
}
