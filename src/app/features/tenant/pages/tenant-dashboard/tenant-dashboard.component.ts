import { ChangeDetectionStrategy, Component, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-tenant-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-dashboard.component.html'})
export class TenantDashboardComponent implements AfterViewInit {
  private platformId = inject(PLATFORM_ID);

  @ViewChild('attendanceChart') attendanceChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;

  kpiCards = [
    { label: 'Total Students', value: '1,248', icon: 'school', trend: 12, bgClass: 'bg-indigo-600/10 dark:bg-indigo-900/20', iconClass: 'text-indigo-600 dark:text-indigo-400', subtext: '+42 this month' },
    { label: 'Active Groups', value: '42', icon: 'groups', trend: 5, bgClass: 'bg-violet-50 dark:bg-violet-900/20', iconClass: 'text-violet-600 dark:text-violet-400', subtext: 'Across 8 levels' },
    { label: 'Today Sessions', value: '18', icon: 'event', bgClass: 'bg-amber-50 dark:bg-amber-900/20', iconClass: 'text-amber-600 dark:text-amber-400', subtext: '6 completed so far' },
    { label: 'Attendance Rate', value: '94.2%', icon: 'fact_check', trend: 2.4, bgClass: 'bg-emerald-50 dark:bg-emerald-900/20', iconClass: 'text-emerald-600 dark:text-emerald-400', subtext: 'Weekly average' },
    { label: 'Overdue Payments', value: '$3,450', icon: 'money_off', trend: -8, bgClass: 'bg-rose-50 dark:bg-rose-900/20', iconClass: 'text-rose-600 dark:text-rose-400', subtext: '15 students pending' },
  ];

  quickActions = [
    { label: 'Add Student', icon: 'person_add', color: 'text-indigo-600' },
    { label: 'Create Group', icon: 'group_add', color: 'text-violet-500' },
    { label: 'New Session', icon: 'more_time', color: 'text-emerald-500' },
    { label: 'Record Pay', icon: 'payments', color: 'text-amber-500' },
  ];

  todaySessions = [
    { id: 1, time: '09:00 AM', group: 'Physics G12-A', subject: 'Advanced Mechanics', teacher: 'Dr. Ahmed Samir', room: 'Lab 1', status: 'Completed' },
    { id: 2, time: '10:30 AM', group: 'Math G10-B', subject: 'Calculus Basics', teacher: 'Mrs. Sarah Hassan', room: 'Room 102', status: 'In Progress' },
    { id: 3, time: '12:00 PM', group: 'Chemistry G11-A', subject: 'Organic Chemistry', teacher: 'Dr. Hassan Ali', room: 'Lab 2', status: 'Scheduled' },
    { id: 4, time: '02:00 PM', group: 'English G12-C', subject: 'Literature', teacher: 'Ms. Mona Zaki', room: 'Room 103', status: 'Scheduled' },
    { id: 5, time: '03:30 PM', group: 'Biology G10-A', subject: 'Cell Biology', teacher: 'Dr. Ali Mahmoud', room: 'Room 101', status: 'Scheduled' },
  ];

  pendingPayments = [
    { student: 'Omar Khaled', amount: '$120', dueDate: 'Today' },
    { student: 'Laila Youssef', amount: '$85', dueDate: 'Yesterday' },
    { student: 'Karim Nabil', amount: '$200', dueDate: '2 days ago' },
    { student: 'Hana Ahmed', amount: '$150', dueDate: '3 days ago' },
  ];

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initAttendanceChart();
      this.initRevenueChart();
    }
  }

  private initAttendanceChart() {
    const ctx = this.attendanceChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Attendance %',
          data: [92, 95, 94, 91, 96, 88, 90],
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: '#6366f1'
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
            beginAtZero: false,
            min: 80,
            max: 100,
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  private initRevenueChart() {
    const ctx = this.revenueChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'Revenue',
          data: [4500, 5200, 4800, 6100],
          backgroundColor: '#10b981',
          borderRadius: 6,
          barThickness: 30
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
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Scheduled': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-500';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}
