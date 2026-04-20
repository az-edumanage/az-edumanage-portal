import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService, UserRole } from '../../services/dashboard.service';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, MatIconModule, ButtonComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'})
export class TopbarComponent {
  private dashboardService = inject(DashboardService);
  
  theme = this.dashboardService.theme;
  currentRole = this.dashboardService.currentRole;
  roles: UserRole[] = ['owner', 'tenant', 'teacher'];

  toggleSidebar() {
    this.dashboardService.toggleSidebar();
  }

  toggleTheme() {
    this.dashboardService.toggleTheme();
  }

  setRole(role: UserRole) {
    this.dashboardService.setRole(role);
  }

  pageTitle() {
    const role = this.currentRole();
    return role === 'owner' ? 'Platform Overview' : 
           role === 'tenant' ? 'Center Dashboard' : 'Teacher Portal';
  }
}
