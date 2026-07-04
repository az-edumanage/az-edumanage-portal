import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TopbarComponent } from './topbar.component';
import { DashboardService, WorkspaceRole } from '../../services/dashboard.service';
import { I18nService } from '../../services/i18n.service';
import { TenantImpersonationService } from '../../auth/tenant-impersonation.service';
import { AuthIdentityService } from '../../auth/auth-identity.service';
import { NotificationsService, UserNotification } from '../../services/notifications.service';

describe('TopbarComponent', () => {
  let roleSignal: ReturnType<typeof signal<WorkspaceRole>>;
  let primaryRoleSignal: ReturnType<typeof signal<string | null>>;
  let dashboardService: {
    theme: ReturnType<typeof signal<'light' | 'dark'>>;
    currentRole: ReturnType<typeof signal<WorkspaceRole>>;
    toggleSidebar: ReturnType<typeof vi.fn>;
    toggleTheme: ReturnType<typeof vi.fn>;
    setRole: ReturnType<typeof vi.fn>;
  };
  let fixture: ComponentFixture<TopbarComponent>;
  let notificationsService: {
    notifications: ReturnType<typeof signal<UserNotification[]>>;
    unreadCount: ReturnType<typeof signal<number>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    refresh: ReturnType<typeof vi.fn>;
    markRead: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    roleSignal = signal<WorkspaceRole>('owner');
    primaryRoleSignal = signal<string | null>('OWNER');
    dashboardService = {
      theme: signal<'light' | 'dark'>('light'),
      currentRole: roleSignal,
      toggleSidebar: vi.fn(),
      toggleTheme: vi.fn(),
      setRole: vi.fn(),
    };
    notificationsService = {
      notifications: signal<UserNotification[]>([]),
      unreadCount: signal(0),
      isLoading: signal(false),
      refresh: vi.fn().mockResolvedValue(undefined),
      markRead: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [
        { provide: DashboardService, useValue: dashboardService },
        {
          provide: I18nService,
          useValue: {
            language: signal<'en' | 'ar'>('en'),
            setLanguage: vi.fn(),
            t: (key: string) => key,
          },
        },
        {
          provide: TenantImpersonationService,
          useValue: {
            context: signal(null),
            isActive: signal(false),
            canAccessTenantWorkspace: vi.fn().mockReturnValue(true),
            exit: vi.fn().mockReturnValue('/owner/overview'),
          },
        },
        { provide: AuthIdentityService, useValue: { primaryRole: primaryRoleSignal } },
        { provide: Router, useValue: { navigateByUrl: vi.fn().mockResolvedValue(true) } },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    });

    fixture = TestBed.createComponent(TopbarComponent);
  });

  it('shows workspace switcher for owner workspace and owner primary role', () => {
    fixture.detectChanges();

    expect(fixture.componentInstance.showWorkspaceSwitcher()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('topbar.role.owner');
    expect(fixture.nativeElement.textContent).toContain('topbar.role.tenant');
    expect(fixture.nativeElement.textContent).toContain('topbar.role.teacher');
  });

  it('hides workspace switcher for tenant workspace', () => {
    roleSignal.set('tenant');
    fixture.detectChanges();

    expect(fixture.componentInstance.showWorkspaceSwitcher()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('topbar.role.owner');
  });

  it('hides workspace switcher when workspace is unresolved', () => {
    roleSignal.set(null);
    fixture.detectChanges();

    expect(fixture.componentInstance.showWorkspaceSwitcher()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('topbar.role.owner');
  });

  it('hides workspace switcher for non-owner primary roles', () => {
    primaryRoleSignal.set('WEB_USER');
    fixture.detectChanges();

    expect(fixture.componentInstance.showWorkspaceSwitcher()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('topbar.role.owner');
  });

  it('shows unread notification count on the bell', () => {
    notificationsService.unreadCount.set(3);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('3');
  });
});
