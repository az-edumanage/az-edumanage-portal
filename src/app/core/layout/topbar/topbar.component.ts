import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService, UserRole } from '../../services/dashboard.service';
import { AppLanguage, I18nService } from '../../services/i18n.service';
import { TenantImpersonationService } from '../../auth/tenant-impersonation.service';
import { AuthIdentityService } from '../../auth/auth-identity.service';
import { ButtonComponent } from '../../../shared/ui';
import { Router } from '@angular/router';

@Component({
  selector: 'app-topbar',
  imports: [CommonModule, MatIconModule, ButtonComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'})
export class TopbarComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly i18nService = inject(I18nService);
  private readonly tenantImpersonationService = inject(TenantImpersonationService);
  private readonly authIdentityService = inject(AuthIdentityService);
  private readonly router = inject(Router);
  
  theme = this.dashboardService.theme;
  language = this.i18nService.language;
  currentRole = this.dashboardService.currentRole;
  impersonation = this.tenantImpersonationService.context;
  isImpersonating = this.tenantImpersonationService.isActive;
  roles: UserRole[] = ['owner', 'tenant', 'teacher'];

  readonly showWorkspaceSwitcher = computed(() => {
    const currentWorkspace = this.dashboardService.currentRole();
    const primaryRole = (this.authIdentityService.primaryRole() ?? '').trim().toUpperCase();

    return currentWorkspace === 'owner'
      && (primaryRole === 'OWNER' || primaryRole === 'SUPER_ADMIN');
  });

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
