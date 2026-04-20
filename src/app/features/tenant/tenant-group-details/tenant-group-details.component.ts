import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface Student {
  id: string;
  name: string;
  email: string;
  attendanceRate: number;
  lastAttendance: string;
}

interface GroupDetails {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  room: string;
  schedule: string;
  capacity: number;
  enrolled: number;
  fees: number;
  status: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-tenant-group-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-group-details.component.html',
  styleUrl: './tenant-group-details.component.css'})
export class TenantGroupDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  
  group = signal<GroupDetails | null>(null);
  selectedStudent = signal<Student | null>(null);
  students = signal<Student[]>([
    { id: '1', name: 'Ahmed Ali', email: 'ahmed@example.com', attendanceRate: 98, lastAttendance: 'Yesterday' },
    { id: '2', name: 'Sara Mohamed', email: 'sara@example.com', attendanceRate: 92, lastAttendance: 'Yesterday' },
    { id: '3', name: 'Omar Hassan', email: 'omar@example.com', attendanceRate: 85, lastAttendance: '2 days ago' },
    { id: '4', name: 'Laila Mahmoud', email: 'laila@example.com', attendanceRate: 100, lastAttendance: 'Yesterday' },
    { id: '5', name: 'Youssef Ibrahim', email: 'youssef@example.com', attendanceRate: 78, lastAttendance: 'Last week' },
  ]);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    // Mock data fetch
    this.group.set({
      id: id || '1',
      name: 'Physics G12-A',
      subject: 'Physics',
      teacher: 'Dr. Ahmed Zewail',
      room: 'Lab 101',
      schedule: 'Mon, Wed 10:00 AM',
      capacity: 30,
      enrolled: 24,
      fees: 500,
      status: 'Active'
    });
  }

  selectStudent(student: Student) {
    this.selectedStudent.set(student);
  }
}

