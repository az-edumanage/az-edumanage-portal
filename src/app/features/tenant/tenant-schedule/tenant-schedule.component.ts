import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';

interface ScheduleSession {
  id: string;
  groupName: string;
  teacherName: string;
  roomName: string;
  day: string;
  startTime: string; // e.g., "10:00"
  duration: number; // minutes
  color: string;
}

@Component({
  selector: 'app-tenant-schedule',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-schedule.component.html'})
export class TenantScheduleComponent {
  private fb = inject(FormBuilder);

  days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  filterForm = this.fb.group({
    teacher: [''],
    room: [''],
    day: ['']
  });

  filterValues = toSignal(
    this.filterForm.valueChanges.pipe(startWith(this.filterForm.value)),
    { initialValue: this.filterForm.value }
  );

  sessions = signal<ScheduleSession[]>([
    { id: '1', groupName: 'Physics G12-A', teacherName: 'Dr. Ahmed Zewail', roomName: 'Lab 101', day: 'Monday', startTime: '10:00', duration: 90, color: 'bg-indigo-500 text-white' },
    { id: '2', groupName: 'Math G11-B', teacherName: 'Prof. Mona Helmy', roomName: 'Room 204', day: 'Monday', startTime: '12:00', duration: 60, color: 'bg-emerald-500 text-white' },
    { id: '3', groupName: 'Chemistry G12', teacherName: 'Mr. Khaled Said', roomName: 'Lab 101', day: 'Tuesday', startTime: '09:00', duration: 90, color: 'bg-amber-500 text-white' },
    { id: '4', groupName: 'English G10', teacherName: 'Ms. Fatma Ali', roomName: 'Room 302', day: 'Wednesday', startTime: '14:00', duration: 60, color: 'bg-rose-500 text-white' },
    { id: '5', groupName: 'Biology G11', teacherName: 'Dr. Mostafa El-Sayed', roomName: 'Lab 102', day: 'Thursday', startTime: '11:00', duration: 90, color: 'bg-purple-500 text-white' },
    { id: '6', groupName: 'Physics G12-B', teacherName: 'Dr. Ahmed Zewail', roomName: 'Lab 101', day: 'Monday', startTime: '14:00', duration: 90, color: 'bg-indigo-500 text-white' },
    { id: '7', groupName: 'Math G12-A', teacherName: 'Prof. Mona Helmy', roomName: 'Room 204', day: 'Sunday', startTime: '10:00', duration: 120, color: 'bg-emerald-500 text-white' },
    { id: '8', groupName: 'Arabic G10', teacherName: 'Mr. Hassan Ali', roomName: 'Room 105', day: 'Saturday', startTime: '16:00', duration: 90, color: 'bg-sky-500 text-white' },
  ]);

  teachers = computed(() => [...new Set(this.sessions().map(s => s.teacherName))]);
  rooms = computed(() => [...new Set(this.sessions().map(s => s.roomName))]);

  activeFiltersCount = computed(() => {
    let count = 0;
    const values = this.filterValues();
    if (values.teacher) count++;
    if (values.room) count++;
    if (values.day) count++;
    return count;
  });

  filteredSessions = computed(() => {
    const filters = this.filterValues();
    return this.sessions().filter(session => {
      const matchesTeacher = !filters.teacher || session.teacherName === filters.teacher;
      const matchesRoom = !filters.room || session.roomName === filters.room;
      const matchesDay = !filters.day || session.day === filters.day;
      return matchesTeacher && matchesRoom && matchesDay;
    });
  });

  getSessionsFor(day: string, time: string) {
    return this.filteredSessions().filter(s => s.day === day && s.startTime === time);
  }

  resetFilters() {
    this.filterForm.reset({
      teacher: '',
      room: '',
      day: ''
    });
  }
}
