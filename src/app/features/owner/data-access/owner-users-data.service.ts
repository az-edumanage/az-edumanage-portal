import { Injectable, signal } from '@angular/core';
import { PlatformUser } from '../models/owner-users.models';

@Injectable({ providedIn: 'root' })
export class OwnerUsersDataService {
  readonly users = signal<PlatformUser[]>([
    {
      id: 'usr-1',
      fullName: 'Ahmed Hassan',
      email: 'ahmed.hassan@platform.com',
      role: 'Super Admin',
      status: 'Active',
      lastLogin: 'Just now',
      mfaEnabled: true,
      createdDate: 'Jan 1, 2023',
    },
    {
      id: 'usr-2',
      fullName: 'Sarah Miller',
      email: 'sarah.m@platform.com',
      role: 'Support Agent',
      status: 'Active',
      lastLogin: '2 hours ago',
      mfaEnabled: true,
      createdDate: 'Mar 15, 2023',
    },
    {
      id: 'usr-3',
      fullName: 'John Doe',
      email: 'john.d@platform.com',
      role: 'Billing Manager',
      status: 'Active',
      lastLogin: '1 day ago',
      mfaEnabled: false,
      createdDate: 'Jun 10, 2023',
    },
    {
      id: 'usr-4',
      fullName: 'Mike Ross',
      email: 'mike.r@platform.com',
      role: 'Developer',
      status: 'Suspended',
      lastLogin: '2 weeks ago',
      mfaEnabled: true,
      createdDate: 'Aug 5, 2023',
    },
  ]);
}
