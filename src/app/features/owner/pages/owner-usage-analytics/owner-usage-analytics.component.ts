import { Component, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { OwnerUsageAnalyticsFacade } from '../../state/owner-usage-analytics.facade';

Chart.register(...registerables);

@Component({
  selector: 'app-owner-usage-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-usage-analytics.component.html',
  styleUrl: './owner-usage-analytics.component.css'})
export class OwnerUsageAnalyticsComponent implements AfterViewInit {
  @ViewChild('topModulesChart') topModulesCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('usageTrendChart') usageTrendCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly facade = inject(OwnerUsageAnalyticsFacade);

  readonly selectedDateRange = this.facade.selectedDateRange;
  readonly modules = this.facade.modules;
  readonly tenants = this.facade.tenants;

  ngAfterViewInit() {
    this.initCharts();
  }

  updateData() {
    this.facade.updateData();
  }

  initCharts() {
    new Chart(this.topModulesCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Students', 'Exams', 'Academic', 'Finance', 'Scheduling'],
        datasets: [{
          label: 'Active Usage',
          data: [98, 96, 100, 83, 75],
          backgroundColor: [
            'rgba(99, 102, 241, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(139, 92, 246, 0.8)'
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

    new Chart(this.usageTrendCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
        datasets: [
          {
            label: 'Active Users',
            data: [6500, 6800, 7200, 7500, 8100, 8542],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'API Calls (x1000)',
            data: [1800, 1950, 2100, 2250, 2350, 2400],
            borderColor: '#10b981',
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
