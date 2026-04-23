import { Injectable, signal } from '@angular/core';
import { Student } from '../models/tenant-students.models';

@Injectable({ providedIn: 'root' })
export class TenantStudentsDataService {
  readonly students = signal<Student[]>([
    {
      id: '1',
      name: 'Ahmed Ali',
      email: 'ahmed@example.com',
      grade: 'Grade 12',
      status: 'Active',
      enrollmentDate: 'Sep 2023',
    },
    {
      id: '2',
      name: 'Sara Mohamed',
      email: 'sara@example.com',
      grade: 'Grade 11',
      status: 'Active',
      enrollmentDate: 'Oct 2023',
    },
    {
      id: '3',
      name: 'Omar Hassan',
      email: 'omar@example.com',
      grade: 'Grade 12',
      status: 'Inactive',
      enrollmentDate: 'Aug 2023',
    },
    {
      id: '4',
      name: 'Laila Mahmoud',
      email: 'laila@example.com',
      grade: 'Grade 10',
      status: 'Active',
      enrollmentDate: 'Jan 2024',
    },
  ]);
}
