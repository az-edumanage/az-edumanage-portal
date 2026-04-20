import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

export type PlatformRole = 'Super Admin' | 'Support Agent' | 'Billing Manager' | 'Developer';
export type UserStatus = 'Active' | 'Suspended' | 'Pending';

export interface PlatformUser {
  id: string;
  fullName: string;
  email: string;
  role: PlatformRole;
  status: UserStatus;
  lastLogin: string;
  mfaEnabled: boolean;
  createdDate: string;
  avatar?: string;
}

@Component({
  selector: 'app-owner-users-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-users-list.component.html'})
export class OwnerUsersListComponent {
  filter = signal<'All' | PlatformRole>('All');

  users = signal<PlatformUser[]>([
    {
      id: 'usr-1',
      fullName: 'Ahmed Hassan',
      email: 'ahmed.hassan@platform.com',
      role: 'Super Admin',
      status: 'Active',
      lastLogin: 'Just now',
      mfaEnabled: true,
      createdDate: 'Jan 1, 2023'
    },
    {
      id: 'usr-2',
      fullName: 'Sarah Miller',
      email: 'sarah.m@platform.com',
      role: 'Support Agent',
      status: 'Active',
      lastLogin: '2 hours ago',
      mfaEnabled: true,
      createdDate: 'Mar 15, 2023'
    },
    {
      id: 'usr-3',
      fullName: 'John Doe',
      email: 'john.d@platform.com',
      role: 'Billing Manager',
      status: 'Active',
      lastLogin: '1 day ago',
      mfaEnabled: false,
      createdDate: 'Jun 10, 2023'
    },
    {
      id: 'usr-4',
      fullName: 'Mike Ross',
      email: 'mike.r@platform.com',
      role: 'Developer',
      status: 'Suspended',
      lastLogin: '2 weeks ago',
      mfaEnabled: true,
      createdDate: 'Aug 5, 2023'
    }
  ]);

  filteredUsers = computed(() => {
    const currentFilter = this.filter();
    if (currentFilter === 'All') {
      return this.users();
    }
    return this.users().filter(u => u.role === currentFilter);
  });
}
