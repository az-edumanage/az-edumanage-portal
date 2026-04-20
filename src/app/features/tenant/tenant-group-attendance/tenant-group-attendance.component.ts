import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

interface StudentAttendance {
  id: string;
  name: string;
  isPresent: boolean;
  attendanceRate: number;
  totalSessions: number;
  attendedSessions: number;
}

@Component({
  selector: 'app-tenant-group-attendance',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './tenant-group-attendance.component.html'})
export class TenantGroupAttendanceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  
  groupId = signal<string | null>(null);
  today = new Date();
  
  students = signal<StudentAttendance[]>([
    { id: '1', name: 'Ahmed Ali', isPresent: true, attendanceRate: 98, totalSessions: 20, attendedSessions: 19 },
    { id: '2', name: 'Sara Mohamed', isPresent: true, attendanceRate: 92, totalSessions: 20, attendedSessions: 18 },
    { id: '3', name: 'Omar Hassan', isPresent: false, attendanceRate: 85, totalSessions: 20, attendedSessions: 17 },
    { id: '4', name: 'Laila Mahmoud', isPresent: true, attendanceRate: 100, totalSessions: 20, attendedSessions: 20 },
    { id: '5', name: 'Youssef Ibrahim', isPresent: false, attendanceRate: 78, totalSessions: 20, attendedSessions: 15 },
  ]);

  presentCount = () => this.students().filter(s => s.isPresent).length;
  absentCount = () => this.students().filter(s => !s.isPresent).length;
  attendanceRate = () => Math.round((this.presentCount() / this.students().length) * 100);

  ngOnInit() {
    this.groupId.set(this.route.snapshot.paramMap.get('id'));
  }

  toggleAttendance(id: string, isPresent: boolean) {
    this.students.update(list => list.map(s => s.id === id ? { ...s, isPresent } : s));
  }

  markAll(isPresent: boolean) {
    this.students.update(list => list.map(s => ({ ...s, isPresent })));
  }

  saveAttendance() {
    console.log('Saving attendance:', this.students());
    alert('Attendance saved successfully!');
  }
}
