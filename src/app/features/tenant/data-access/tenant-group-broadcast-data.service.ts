import { Injectable } from '@angular/core';
import { TenantBroadcastMessage } from '../models/tenant-group-broadcast.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupBroadcastDataService {
  private readonly mockMessages: TenantBroadcastMessage[] = [
    {
      id: '1',
      sender: 'System',
      text: 'Welcome to the Physics G12-A Broadcast channel!',
      time: '09:00 AM',
      isMe: false,
      role: 'Teacher',
    },
    {
      id: '2',
      sender: 'Dr. Ahmed Zewail',
      text: 'Good morning everyone! Today we will discuss Quantum Mechanics.',
      time: '10:05 AM',
      isMe: true,
      role: 'Teacher',
    },
    {
      id: '3',
      sender: 'Ahmed Ali',
      text: 'Will there be a quiz today?',
      time: '10:07 AM',
      isMe: false,
      role: 'Student',
    },
    {
      id: '4',
      sender: 'Dr. Ahmed Zewail',
      text: 'Yes, check the Exam section in a few minutes.',
      time: '10:10 AM',
      isMe: true,
      role: 'Teacher',
    },
  ];

  private readonly mockOnlineStudents = [
    'Ahmed Ali',
    'Sara Mohamed',
    'Omar Hassan',
    'Laila Mahmoud',
    'Youssef Ibrahim',
    'Mona Ahmed',
  ];

  getMessagesByGroupId(groupId: string | null): TenantBroadcastMessage[] {
    void groupId;
    return this.mockMessages.map((message) => ({ ...message }));
  }

  getOnlineStudentsByGroupId(groupId: string | null): string[] {
    void groupId;
    return [...this.mockOnlineStudents];
  }

  createOutgoingMessage(text: string): TenantBroadcastMessage {
    return {
      id: Date.now().toString(),
      sender: 'Dr. Ahmed Zewail',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      role: 'Teacher',
    };
  }
}
