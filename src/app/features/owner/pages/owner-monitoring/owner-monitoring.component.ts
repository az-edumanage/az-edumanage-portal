import { Component, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';
import { OwnerMonitoringFacade } from '../../state/owner-monitoring.facade';

Chart.register(...registerables);

@Component({
  selector: 'app-owner-monitoring',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './owner-monitoring.component.html'})
export class OwnerMonitoringComponent implements AfterViewInit {
  @ViewChild('cpuChart') cpuCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('memoryChart') memoryCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('responseChart') responseCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly facade = inject(OwnerMonitoringFacade);

  readonly alerts = this.facade.alerts;
  readonly tenantHealth = this.facade.tenantHealth;
  readonly logs = this.facade.logs;

  ngAfterViewInit() {
    this.initCharts();
  }

  initCharts() {
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' } }
      }
    };

    new Chart(this.cpuCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: ['10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30', '11:45'],
        datasets: [{
          data: [25, 28, 35, 32, 45, 42, 38, 40],
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        ...commonOptions,
        scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, max: 100 } }
      }
    });

    new Chart(this.memoryCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: ['10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30', '11:45'],
        datasets: [{
          data: [60, 62, 65, 64, 68, 70, 72, 71],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        ...commonOptions,
        scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, max: 100 } }
      }
    });

    new Chart(this.responseCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30', '11:45'],
        datasets: [{
          data: [120, 135, 125, 140, 180, 160, 145, 130],
          backgroundColor: '#f59e0b',
          borderRadius: 4
        }]
      },
      options: commonOptions
    });
  }
}
