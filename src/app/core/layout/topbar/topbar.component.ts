import { Component, ElementRef, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService, UserRole } from '../../services/dashboard.service';
import { AppLanguage, I18nService } from '../../services/i18n.service';
import { TenantImpersonationService } from '../../auth/tenant-impersonation.service';
import { AuthIdentityService } from '../../auth/auth-identity.service';
import { ButtonComponent } from '../../../shared/ui';
import { Router } from '@angular/router';
import { NotificationsService, UserNotification } from '../../services/notifications.service';

@Component({
  selector: 'app-topbar',
  imports: [CommonModule, MatIconModule, ButtonComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'})
export class TopbarComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly i18nService = inject(I18nService);
  private readonly tenantImpersonationService = inject(TenantImpersonationService);
  private readonly authIdentityService = inject(AuthIdentityService);
  private readonly router = inject(Router);
  private readonly notificationsService = inject(NotificationsService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private refreshIntervalId: ReturnType<typeof setInterval> | null = null;
  
  theme = this.dashboardService.theme;
  language = this.i18nService.language;
  currentRole = this.dashboardService.currentRole;
  impersonation = this.tenantImpersonationService.context;
  isImpersonating = this.tenantImpersonationService.isActive;
  notifications = this.notificationsService.notifications;
  unreadCount = this.notificationsService.unreadCount;
  notificationsLoading = this.notificationsService.isLoading;
  notificationsOpen = signal(false);
  roles: UserRole[] = ['owner', 'tenant', 'teacher'];

  readonly showWorkspaceSwitcher = computed(() => {
    const currentWorkspace = this.dashboardService.currentRole();
    const primaryRole = (this.authIdentityService.primaryRole() ?? '').trim().toUpperCase();

    return currentWorkspace === 'owner'
      && (primaryRole === 'OWNER' || primaryRole === 'SUPER_ADMIN');
  });

  ngOnInit(): void {
    void this.notificationsService.refresh();
    this.refreshIntervalId = setInterval(() => void this.notificationsService.refresh(), 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }
  }

  @HostListener('document:click', ['$event'])
  closeNotificationsOnOutsideClick(event: MouseEvent): void {
    if (!this.notificationsOpen()) {
      return;
    }
    const target = event.target;
    if (target instanceof Node && !this.elementRef.nativeElement.contains(target)) {
      this.notificationsOpen.set(false);
    }
  }

  toggleSidebar() {
    this.dashboardService.toggleSidebar();
  }

  toggleTheme() {
    this.dashboardService.toggleTheme();
  }

  setLanguage(language: AppLanguage) {
    this.i18nService.setLanguage(language);
  }

  setRole(role: UserRole) {
    if (!this.showWorkspaceSwitcher()) {
      return;
    }

    if (role === 'tenant' && !this.tenantImpersonationService.canAccessTenantWorkspace()) {
      return;
    }

    if (role === 'owner' && this.tenantImpersonationService.isActive()) {
      this.exitImpersonation();
      return;
    }

    this.dashboardService.setRole(role);
  }

  exitImpersonation(): void {
    const returnUrl = this.tenantImpersonationService.exit();
    void this.router.navigateByUrl(returnUrl);
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationsOpen.update((open) => !open);
    if (!this.notificationsOpen()) {
      return;
    }
    void this.notificationsService.refresh();
  }

  async openNotification(notification: UserNotification): Promise<void> {
    await this.notificationsService.markRead(notification);
    this.notificationsOpen.set(false);
    if (notification.linkPath) {
      await this.router.navigateByUrl(notification.linkPath);
    }
  }

  refreshNotifications(): void {
    void this.notificationsService.refresh();
  }

  notificationCountLabel(): string {
    const count = this.unreadCount();
    return count > 99 ? '99+' : String(count);
  }

  t(text: string) {
    return this.i18nService.t(text);
  }

  pageTitle() {
    const role = this.currentRole();
    if (role === 'owner') {
      return this.t('topbar.pageTitle.owner');
    }
    if (role === 'tenant') {
      return this.t('topbar.pageTitle.tenant');
    }
    if (role === 'teacher') {
      return this.t('topbar.pageTitle.teacher');
    }
    return '';
  }

  profileInitial() {
    const role = this.currentRole();
    return role ? role.substring(0, 1).toUpperCase() : 'U';
  }

  roleLabel(role: UserRole) {
    return this.t(`topbar.role.${role}`);
  }
}
