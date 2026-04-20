import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { TaskBarComponent } from '../task-bar/task-bar.component';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent, TaskBarComponent, MatIconModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'})
export class MainLayoutComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  
  collapsed = this.dashboardService.sidebarCollapsed;

  ngOnInit() {
    this.dashboardService.initTheme();
  }
}
