import { Injectable, signal } from '@angular/core';
import { Teacher, TeacherStatus } from '../models/tenant-teachers.models';

@Injectable({ providedIn: 'root' })
export class TenantTeachersDataService {
  readonly teachers = signal<Teacher[]>([
    {
      id: '1',
      name: 'Dr. Ahmed Zewail',
      email: 'zewail@center.edu',
      subject: 'Physics',
      status: 'Active',
      joinDate: 'Jan 2022',
    },
    {
      id: '2',
      name: 'Prof. Mona Helmy',
      email: 'mona@center.edu',
      subject: 'Mathematics',
      status: 'Active',
      joinDate: 'Mar 2022',
    },
    {
      id: '3',
      name: 'Mr. Khaled Said',
      email: 'khaled@center.edu',
      subject: 'Chemistry',
      status: 'On Leave',
      joinDate: 'Jun 2022',
    },
    {
      id: '4',
      name: 'Ms. Fatma Ali',
      email: 'fatma@center.edu',
      subject: 'Biology',
      status: 'Active',
      joinDate: 'Sep 2022',
    },
  ]);

  updateStatus(id: string, status: TeacherStatus): void {
    this.teachers.update((list) =>
      list.map((teacher) => (teacher.id === id ? { ...teacher, status } : teacher)),
    );
  }
}
