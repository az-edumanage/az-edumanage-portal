import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface GradeGroup {
  id: string;
  name: string;
  teacher: string;
  studentCount: number;
  status: string;
}

interface GradeDetails {
  id: string;
  name: string;
  level: string;
  description: string;
  totalStudents: number;
  totalGroups: number;
  totalTeachers: number;
}

@Component({
  selector: 'app-tenant-grade-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-grade-details.component.html'})
export class TenantGradeDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);

  grade = signal<GradeDetails | null>(null);
  groups = signal<GradeGroup[]>([]);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    
    // Mock data fetch
    this.grade.set({
      id: id || '1',
      name: id === '1' ? 'Grade 10' : id === '2' ? 'Grade 11' : 'Grade 12',
      level: 'Secondary',
      description: 'This grade level focuses on advanced core subjects and preparation for university entrance exams. Students in this grade are expected to maintain high academic standards.',
      totalStudents: 120,
      totalGroups: 4,
      totalTeachers: 8
    });

    this.groups.set([
      { id: '101', name: 'Group A - Physics', teacher: 'Dr. Ahmed Zewail', studentCount: 30, status: 'Full' },
      { id: '102', name: 'Group B - Math', teacher: 'Prof. Mona Helmy', studentCount: 28, status: 'Active' },
      { id: '103', name: 'Group C - Chemistry', teacher: 'Mr. Khaled Said', studentCount: 25, status: 'Active' },
      { id: '104', name: 'Group D - Biology', teacher: 'Dr. Sara Ahmed', studentCount: 32, status: 'Full' },
    ]);
  }
}
