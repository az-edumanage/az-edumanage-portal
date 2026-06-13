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

const educationRoutes = ['/tenant/educational-stages', '/tenant/grades', '/tenant/subjects'];
const universityEducationRoutes = ['/tenant/universities', '/tenant/colleges', '/tenant/university-subjects'];

describe('SidebarComponent', () => {
  let currentRole: ReturnType<typeof signal<WorkspaceRole>>;

  beforeEach(() => {
    currentRole = signal<WorkspaceRole>('tenant');

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
        { provide: AuthIdentityService, useValue: { username: signal('tenant'), primaryRole: signal('WEB_USER'), clearIdentity: vi.fn() } },
        { provide: AuthApiService, useValue: { logout: vi.fn().mockResolvedValue(undefined) } },
        { provide: TenantImpersonationService, useValue: { clear: vi.fn() } },
      ],
    });
  });

  it('returns only tenant menu sections for tenant workspace', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const sections = fixture.componentInstance.menuSections();
    const routes = sections.flatMap((section) => section.items.map((item) => item.route).filter(Boolean));
    const basicEducation = sections
      .flatMap((section) => section.items)
      .find((item) => item.labelKey === 'sidebar.item.basicEducation');
    const mainItems = sections.find((section) => section.titleKey === 'sidebar.section.main')?.items ?? [];
    const universityEducation = mainItems.find((item) => item.labelKey === 'sidebar.item.universityEducation');

    expect(routes).toContain('/tenant/overview');
    expect(routes).toContain('/tenant/students');
    expect(routes).toContain('/tenant/settings');
    expect(routes).toContain('/tenant/web-settings');
    expect(routes).not.toContain('/owner/overview');

    expect(basicEducation?.route).toBeUndefined();
    expect(basicEducation?.children?.map((child) => child.route)).toEqual(educationRoutes);
    expect(mainItems.findIndex((item) => item.labelKey === 'sidebar.item.universityEducation'))
      .toBe(mainItems.findIndex((item) => item.labelKey === 'sidebar.item.basicEducation') + 1);
    expect(universityEducation?.route).toBeUndefined();
    expect(universityEducation?.children?.map((child) => child.route)).toEqual(universityEducationRoutes);
    educationRoutes.forEach((route) => expect(routes).not.toContain(route));
    universityEducationRoutes.forEach((route) => expect(routes).not.toContain(route));
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

  it('logs out to the current route workspace login when available', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(SidebarComponent);

    await fixture.componentInstance.logout();

    expect(router.navigate).toHaveBeenCalledWith(['/tenant/login']);
  });
});
