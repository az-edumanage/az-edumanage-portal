import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService, UserRole } from '../../services/dashboard.service';
import { AppLanguage, I18nService } from '../../services/i18n.service';
import { ButtonComponent } from '../../../shared/ui';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, MatIconModule, ButtonComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'})
export class TopbarComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly i18nService = inject(I18nService);
  
  theme = this.dashboardService.theme;
  language = this.i18nService.language;
  currentRole = this.dashboardService.currentRole;
  roles: UserRole[] = ['owner', 'tenant', 'teacher'];

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
    this.dashboardService.setRole(role);
  }

  t(text: string) {
    return this.i18nService.t(text);
  }

  pageTitle() {
    const role = this.currentRole();
    return role === 'owner'
      ? this.t('topbar.pageTitle.owner')
      : role === 'tenant'
        ? this.t('topbar.pageTitle.tenant')
        : this.t('topbar.pageTitle.teacher');
  }

  roleLabel(role: UserRole) {
    return this.t(`topbar.role.${role}`);
  }
}
