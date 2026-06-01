import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { TaskBarComponent } from '../task-bar/task-bar.component';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../services/dashboard.service';
import { I18nService } from '../../services/i18n.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent, TaskBarComponent, MatIconModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'})
export class MainLayoutComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly i18nService = inject(I18nService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  
  collapsed = this.dashboardService.sidebarCollapsed;
  language = this.i18nService.language;

  constructor() {
    this.dashboardService.syncRoleFromUrl(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.dashboardService.syncRoleFromUrl(event.urlAfterRedirects));
  }
}
