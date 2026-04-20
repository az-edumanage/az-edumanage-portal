import { Component, AfterViewInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface Alert {
  id: string;
  title: string;
  severity: 'Critical' | 'Warning' | 'Info';
  timestamp: string;
  status: 'Open' | 'Acknowledged' | 'Resolved';
  assignedTo: string;
}

interface TenantHealth {
  name: string;
  plan: string;
  storageUsed: string;
  apiUsage: string;
  errorCount: number;
  status: 'Healthy' | 'Degraded' | 'Critical';
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'Error' | 'Warning' | 'Info';
  tenant: string;
  message: string;
}

@Component({
  selector: 'app-owner-monitoring',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './owner-monitoring.component.html'})
export class OwnerMonitoringComponent implements AfterViewInit {
  @ViewChild('cpuChart') cpuCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('memoryChart') memoryCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('responseChart') responseCanvas!: ElementRef<HTMLCanvasElement>;

  alerts = signal<Alert[]>([
    { id: 'a1', title: 'High Database Latency', severity: 'Critical', timestamp: '10 mins ago', status: 'Open', assignedTo: 'DevOps Team' },
    { id: 'a2', title: 'Storage Limit Approaching - Tenant T-102', severity: 'Warning', timestamp: '1 hour ago', status: 'Acknowledged', assignedTo: 'Support' },
    { id: 'a3', title: 'API Rate Limit Spike', severity: 'Info', timestamp: '2 hours ago', status: 'Resolved', assignedTo: 'System' },
  ]);

  tenantHealth = signal<TenantHealth[]>([
    { name: 'Cairo Math Center', plan: 'Enterprise', storageUsed: '45 GB', apiUsage: 'High', errorCount: 2, status: 'Healthy' },
    { name: 'Future Academy', plan: 'Starter', storageUsed: '4.8 GB', apiUsage: 'Medium', errorCount: 15, status: 'Degraded' },
    { name: 'Elite Tutors', plan: 'Professional', storageUsed: '12 GB', apiUsage: 'Low', errorCount: 0, status: 'Healthy' },
    { name: 'Beta Learning', plan: 'Starter', storageUsed: '5.2 GB', apiUsage: 'Low', errorCount: 45, status: 'Critical' },
  ]);

  logs = signal<LogEntry[]>([
    { id: 'l1', timestamp: '2026-02-21 11:50:05', level: 'Info', tenant: 'System', message: 'Scheduled backup completed successfully.' },
    { id: 'l2', timestamp: '2026-02-21 11:48:12', level: 'Error', tenant: 'Beta Learning', message: 'Payment gateway timeout: Connection refused.' },
    { id: 'l3', timestamp: '2026-02-21 11:45:30', level: 'Warning', tenant: 'Future Academy', message: 'Slow query detected on Students table (1200ms).' },
    { id: 'l4', timestamp: '2026-02-21 11:42:10', level: 'Info', tenant: 'Cairo Math Center', message: 'User batch import started.' },
    { id: 'l5', timestamp: '2026-02-21 11:40:00', level: 'Info', tenant: 'System', message: 'Health check passed for all services.' },
  ]);

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

    // CPU Chart
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

    // Memory Chart
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

    // Response Time Chart
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
