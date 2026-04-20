import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './teacher-dashboard.component.html'})
export class TeacherDashboardComponent {
  sessions = [
    { id: 1, time: '09:00 AM', group: 'Physics G10-A', room: 'Room 101', students: 24, status: 'Completed' },
    { id: 2, time: '10:30 AM', group: 'Physics G10-B', room: 'Room 101', students: 22, status: 'Completed' },
    { id: 3, time: '12:30 PM', group: 'Physics G12-Advanced', room: 'Lab 2', students: 18, status: 'Upcoming' },
    { id: 4, time: '02:00 PM', group: 'Physics G11-C', room: 'Room 103', students: 25, status: 'Upcoming' },
    { id: 5, time: '03:30 PM', group: 'Revision G12', room: 'Hall A', students: 40, status: 'Upcoming' },
  ];

  attentionList = [
    { name: 'Youssef Ahmed', group: 'Physics G10-A', issue: 'Low Attendance (60%)', severity: 'high' },
    { name: 'Sarah Ali', group: 'Physics G12-Advanced', issue: 'Failed Last Quiz', severity: 'medium' },
    { name: 'Mohamed Samy', group: 'Physics G11-C', issue: 'Missing Homework', severity: 'medium' },
    { name: 'Omar Khaled', group: 'Revision G12', issue: 'Skipped Exam', severity: 'high' },
  ];
}

