import { Injectable, signal } from '@angular/core';
import { Group } from '../models/tenant-groups.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupsDataService {
  readonly groups = signal<Group[]>([
    {
      id: '1',
      name: 'Physics G12-A',
      teacher: 'Dr. Ahmed Zewail',
      subject: 'Physics',
      studentsCount: 24,
      schedule: 'Mon, Wed 10:00 AM',
      room: 'Lab 101',
    },
    {
      id: '2',
      name: 'Math Advanced',
      teacher: 'Prof. Mona Helmy',
      subject: 'Mathematics',
      studentsCount: 18,
      schedule: 'Tue, Thu 02:00 PM',
      room: 'Room 204',
    },
    {
      id: '3',
      name: 'Organic Chem',
      teacher: 'Mr. Khaled Said',
      subject: 'Chemistry',
      studentsCount: 15,
      schedule: 'Sun, Tue 09:00 AM',
      room: 'Lab 102',
    },
    {
      id: '4',
      name: 'Biology Intro',
      teacher: 'Ms. Fatma Ali',
      subject: 'Biology',
      studentsCount: 30,
      schedule: 'Mon, Thu 12:00 PM',
      room: 'Room 301',
    },
  ]);
}
