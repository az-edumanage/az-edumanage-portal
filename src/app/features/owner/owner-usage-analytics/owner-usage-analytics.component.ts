import { Component, AfterViewInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface TenantUsage {
  id: string;
  name: string;
  plan: string;
  activeUsers: number;
  storageUsed: number; // GB
  apiCalls: number;
  mostUsedModule: string;
  riskLevel: 'Low' | 'High' | 'Over Limit';
}

interface ModuleUsage {
  name: string;
  category: 'Core' | 'Advanced';
  enabledTenants: number;
  activeTenants: number;
  usageRate: number; // %
  totalActions: number;
  trend: 'up' | 'down' | 'stable';
}

@Component({
  selector: 'app-owner-usage-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-usage-analytics.component.html'})
export class OwnerUsageAnalyticsComponent implements AfterViewInit {
  @ViewChild('topModulesChart') topModulesCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('usageTrendChart') usageTrendCanvas!: ElementRef<HTMLCanvasElement>;

  selectedDateRange = signal('30days');

  modules = signal<ModuleUsage[]>([
    { name: 'Students Management', category: 'Core', enabledTenants: 124, activeTenants: 120, usageRate: 98, totalActions: 15400, trend: 'up' },
    { name: 'Exams & Grades', category: 'Advanced', enabledTenants: 85, activeTenants: 82, usageRate: 96, totalActions: 8500, trend: 'up' },
    { name: 'Academic Structure', category: 'Core', enabledTenants: 124, activeTenants: 124, usageRate: 100, totalActions: 2200, trend: 'stable' },
    { name: 'Finance', category: 'Advanced', enabledTenants: 42, activeTenants: 35, usageRate: 83, totalActions: 1200, trend: 'up' },
    { name: 'SMS Integration', category: 'Advanced', enabledTenants: 20, activeTenants: 5, usageRate: 25, totalActions: 300, trend: 'down' },
  ]);

  tenants = signal<TenantUsage[]>([
    { id: 't1', name: 'Cairo Math Center', plan: 'Enterprise', activeUsers: 1200, storageUsed: 45, apiCalls: 150000, mostUsedModule: 'Exams', riskLevel: 'Low' },
    { id: 't2', name: 'Elite Tutors', plan: 'Professional', activeUsers: 450, storageUsed: 12, apiCalls: 45000, mostUsedModule: 'Students', riskLevel: 'Low' },
    { id: 't3', name: 'Future Academy', plan: 'Starter', activeUsers: 150, storageUsed: 4.8, apiCalls: 12000, mostUsedModule: 'Scheduling', riskLevel: 'High' },
    { id: 't4', name: 'Alpha School', plan: 'Professional', activeUsers: 800, storageUsed: 22, apiCalls: 89000, mostUsedModule: 'Finance', riskLevel: 'Low' },
    { id: 't5', name: 'Beta Learning', plan: 'Starter', activeUsers: 200, storageUsed: 5.2, apiCalls: 5000, mostUsedModule: 'Students', riskLevel: 'Over Limit' },
  ]);

  ngAfterViewInit() {
    this.initCharts();
  }

  updateData() {
    // In a real app, this would fetch new data based on the selected date range
    console.log('Updating data for range:', this.selectedDateRange());
  }

  initCharts() {
    // Top Modules Chart (Bar)
    new Chart(this.topModulesCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Students', 'Exams', 'Academic', 'Finance', 'Scheduling'],
        datasets: [{
          label: 'Active Usage',
          data: [98, 96, 100, 83, 75],
          backgroundColor: [
            'rgba(99, 102, 241, 0.8)', // Indigo
            'rgba(245, 158, 11, 0.8)', // Amber
            'rgba(16, 185, 129, 0.8)', // Emerald
            'rgba(59, 130, 246, 0.8)', // Blue
            'rgba(139, 92, 246, 0.8)'  // Violet
          ],
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });

    // Usage Trend Chart (Line)
    new Chart(this.usageTrendCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
        datasets: [
          {
            label: 'Active Users',
            data: [6500, 6800, 7200, 7500, 8100, 8542],
            borderColor: '#6366f1', // Indigo
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'API Calls (x1000)',
            data: [1800, 1950, 2100, 2250, 2350, 2400],
            borderColor: '#10b981', // Emerald
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }
}
