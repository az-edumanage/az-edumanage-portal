import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface RoomSchedule {
  day: string;
  time: string;
  group: string;
  teacher: string;
  subject: string;
  studentsCount: number;
  durationHours: number;
}

interface RoomDetails {
  id: string;
  name: string;
  type: string;
  capacity: number;
  status: string;
  equipment: string[];
  notes: string;
  floor?: string;
  building?: string;
}

@Component({
  selector: 'app-tenant-room-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-room-details.component.html'})
export class TenantRoomDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);

  room = signal<RoomDetails | null>(null);
  schedule = signal<RoomSchedule[]>([]);

  // Computed Statistics
  totalOccupiedHours = computed(() => 
    this.schedule().reduce((acc, curr) => acc + curr.durationHours, 0)
  );

  occupiedDaysCount = computed(() => 
    new Set(this.schedule().map(s => s.day)).size
  );

  totalStudents = computed(() => 
    this.schedule().reduce((acc, curr) => acc + curr.studentsCount, 0)
  );

  uniqueGroupsCount = computed(() => 
    new Set(this.schedule().map(s => s.group)).size
  );

  freeDays = computed(() => {
    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const occupied = new Set(this.schedule().map(s => s.day));
    return allDays.filter(day => !occupied.has(day));
  });

  occupancyRate = computed(() => {
    // Assuming 12 hours available per day, 7 days a week = 84 hours
    const availableHours = 84;
    return Math.round((this.totalOccupiedHours() / availableHours) * 100);
  });

  avgGroupSize = computed(() => {
    if (this.schedule().length === 0) return 0;
    return Math.round(this.totalStudents() / this.schedule().length);
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    
    // Mock data fetch
    this.room.set({
      id: id || '1',
      name: id === '2' ? 'Physics Lab' : 'Room 101',
      type: id === '2' ? 'Laboratory' : 'Classroom',
      capacity: id === '2' ? 20 : 30,
      status: id === '2' ? 'Occupied' : 'Available',
      equipment: id === '2' ? ['Lab Kits', 'Projector', 'Safety Gear'] : ['Projector', 'AC', 'Whiteboard'],
      notes: 'This room is equipped with high-speed internet and modern teaching aids. Please ensure all equipment is turned off after use.',
      floor: '1st Floor',
      building: 'Main Block'
    });

    this.schedule.set([
      { day: 'Monday', time: '10:00 AM - 11:30 AM', group: 'Physics G12-A', teacher: 'Dr. Ahmed Zewail', subject: 'Physics', studentsCount: 25, durationHours: 1.5 },
      { day: 'Monday', time: '01:00 PM - 02:30 PM', group: 'Math G11-B', teacher: 'Prof. Mona Helmy', subject: 'Mathematics', studentsCount: 18, durationHours: 1.5 },
      { day: 'Wednesday', time: '10:00 AM - 11:30 AM', group: 'Physics G12-A', teacher: 'Dr. Ahmed Zewail', subject: 'Physics', studentsCount: 25, durationHours: 1.5 },
      { day: 'Thursday', time: '09:00 AM - 10:30 AM', group: 'Chemistry G10-C', teacher: 'Mr. Khaled Said', subject: 'Chemistry', studentsCount: 22, durationHours: 1.5 },
      { day: 'Friday', time: '11:00 AM - 12:30 PM', group: 'Biology G12-D', teacher: 'Dr. Sara Ahmed', subject: 'Biology', studentsCount: 20, durationHours: 1.5 },
    ]);
  }
}
