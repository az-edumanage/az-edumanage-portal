import { Injectable, signal } from '@angular/core';
import {
  LiveActivity,
  RegionDistribution,
  RevenuePlan,
  ServiceHealth,
  StatCard,
} from '../models/owner-overview.models';

@Injectable({ providedIn: 'root' })
export class OwnerOverviewDataService {
  readonly stats = signal<StatCard[]>([
    {
      label: 'Total Revenue',
      value: '$1.42M',
      change: '12.5%',
      trend: 'up',
      icon: 'payments',
      color: 'bg-indigo-600',
      details: '+$142k from last month',
    },
    {
      label: 'Active Tenants',
      value: '1,248',
      change: '8.2%',
      trend: 'up',
      icon: 'business',
      color: 'bg-indigo-600',
      details: '94 new this month',
    },
    {
      label: 'Avg. LTV',
      value: '$4,820',
      change: '3.1%',
      trend: 'up',
      icon: 'trending_up',
      color: 'bg-emerald-600',
      details: 'Lifetime value per center',
    },
    {
      label: 'Churn Rate',
      value: '1.2%',
      change: '0.4%',
      trend: 'down',
      icon: 'person_remove',
      color: 'bg-rose-600',
      details: 'Lowest in 6 months',
    },
  ]);

  readonly plans = signal<RevenuePlan[]>([
    { name: 'Enterprise', value: '$640k', percentage: 45, dotColor: 'bg-indigo-500' },
    { name: 'Professional', value: '$498k', percentage: 35, dotColor: 'bg-blue-500' },
    { name: 'Starter', value: '$285k', percentage: 20, dotColor: 'bg-sky-400' },
  ]);

  readonly activities = signal<LiveActivity[]>([
    {
      id: 1,
      title: 'New Enterprise Tenant',
      description: 'Global Education Group joined.',
      time: '2 mins ago',
      icon: 'add_business',
    },
    {
      id: 2,
      title: 'System Update',
      description: 'v2.4.0 deployed to US-EAST-1.',
      time: '15 mins ago',
      icon: 'system_update',
    },
    {
      id: 3,
      title: 'High Usage Alert',
      description: 'Cairo Math Center exceeded storage.',
      time: '1 hour ago',
      icon: 'priority_high',
    },
    {
      id: 4,
      title: 'Billing Success',
      description: '1,142 invoices processed.',
      time: '3 hours ago',
      icon: 'check_circle',
    },
  ]);

  readonly services = signal<ServiceHealth[]>([
    { name: 'API Gateway', uptime: 99.99 },
    { name: 'Database Cluster', uptime: 99.98 },
    { name: 'Storage Service', uptime: 100 },
  ]);

  readonly regions = signal<RegionDistribution[]>([
    { name: 'Middle East', count: 542, percentage: 43 },
    { name: 'North America', count: 312, percentage: 25 },
    { name: 'Europe', count: 284, percentage: 22 },
    { name: 'Other', count: 110, percentage: 10 },
  ]);
}
