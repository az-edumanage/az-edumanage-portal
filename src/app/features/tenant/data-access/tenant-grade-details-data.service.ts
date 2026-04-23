import { Injectable } from '@angular/core';
import { GradeDetails, GradeGroup } from '../models/tenant-grade-details.models';

@Injectable({ providedIn: 'root' })
export class TenantGradeDetailsDataService {
  readonly groups: GradeGroup[] = [
    { id: '101', name: 'Group A - Physics', teacher: 'Dr. Ahmed Zewail', studentCount: 30, status: 'Full' },
    { id: '102', name: 'Group B - Math', teacher: 'Prof. Mona Helmy', studentCount: 28, status: 'Active' },
    { id: '103', name: 'Group C - Chemistry', teacher: 'Mr. Khaled Said', studentCount: 25, status: 'Active' },
    { id: '104', name: 'Group D - Biology', teacher: 'Dr. Sara Ahmed', studentCount: 32, status: 'Full' },
  ];

  getGradeById(id: string | null): GradeDetails {
    const gradeId = id || '1';

    return {
      id: gradeId,
      name: gradeId === '1' ? 'Grade 10' : gradeId === '2' ? 'Grade 11' : 'Grade 12',
      level: 'Secondary',
      description:
        'This grade level focuses on advanced core subjects and preparation for university entrance exams. Students in this grade are expected to maintain high academic standards.',
      totalStudents: 120,
      totalGroups: 4,
      totalTeachers: 8,
    };
  }
}
