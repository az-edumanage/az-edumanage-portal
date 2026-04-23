import { Injectable, signal } from '@angular/core';
import { PendingRequest, TenantUser } from '../models/tenant-users.models';

@Injectable({ providedIn: 'root' })
export class TenantUsersDataService {
  readonly users = signal<TenantUser[]>([
    {
      id: '1',
      name: 'Ahmed Admin',
      email: 'admin@school.com',
      role: 'Admin',
      status: 'Active',
      lastLogin: '2 hours ago',
    },
    {
      id: '2',
      name: 'Sara Manager',
      email: 'sara.m@school.com',
      role: 'Manager',
      status: 'Active',
      lastLogin: '1 day ago',
    },
    {
      id: '3',
      name: 'John Staff',
      email: 'john.s@school.com',
      role: 'Staff',
      status: 'Inactive',
      lastLogin: '3 days ago',
    },
    {
      id: '4',
      name: 'Dr. Ahmed Zewail',
      email: 'zewail@school.com',
      role: 'Teacher',
      status: 'Active',
      lastLogin: '1 hour ago',
    },
    {
      id: '5',
      name: 'Mona Helmy',
      email: 'mona.h@school.com',
      role: 'Teacher',
      status: 'Pending',
      lastLogin: 'Never',
    },
  ]);

  readonly pendingRequests = signal<PendingRequest[]>([
    {
      id: '1',
      name: 'Youssef Mansour',
      email: 'youssef@example.com',
      requestedRole: 'Teacher',
      date: 'Feb 24, 2026',
    },
    {
      id: '2',
      name: 'Layla Ibrahim',
      email: 'layla@example.com',
      requestedRole: 'Staff',
      date: 'Feb 23, 2026',
    },
  ]);
}
