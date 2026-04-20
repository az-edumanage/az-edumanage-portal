import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { TenantApiService } from '../data-access/tenant-api.service';

@Component({
  selector: 'app-tenant-room-booking',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-room-booking.component.html',
  styleUrl: './tenant-room-booking.component.css'})
export class TenantRoomBookingComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);
  private tenantApi = inject(TenantApiService);

  roomId = signal<string | null>(null);
  roomName = signal('Room 101');
  isSubmitting = signal(false);
  private isSuccess = false;
  private taskId = '';

  bookingForm = this.fb.group({
    purpose: ['', [Validators.required, Validators.minLength(3)]],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    teacher: ['', Validators.required],
    startTime: ['10:00', Validators.required],
    endTime: ['11:30', Validators.required],
    isRecurring: [false]
  });

  ngOnInit() {
    this.roomId.set(this.route.snapshot.paramMap.get('id'));
    this.taskId = `booking-room-${this.roomId()}`;
    
    // In a real app, fetch room name by ID
    if (this.roomId() === '2') this.roomName.set('Physics Lab');

    // Restore task data if exists
    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask && savedTask.data) {
      this.bookingForm.patchValue(savedTask.data);
      // Remove task from service after restoring
      this.taskService.removeTask(this.taskId);
    }
  }

  ngOnDestroy() {
    // Save task if form has data and was not successfully submitted
    const value = this.bookingForm.value;
    const hasData = value.purpose !== '' || value.teacher !== '';
    
    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `Booking Room: ${this.roomName()}`,
        route: this.router.url,
        data: value
      });
    }
  }

  onCancel() {
    this.isSuccess = true; // Prevent auto-save on destroy
    this.taskService.removeTask(this.taskId);
    this.router.navigate(['/tenant/rooms', this.roomId()]);
  }

  onSubmit() {
    if (this.bookingForm.valid) {
      this.isSubmitting.set(true);
      this.tenantApi.bookRoom(this.bookingForm.getRawValue()).subscribe((payload) => {
        console.log('Booking Confirmed:', payload);
        this.isSuccess = true;
        this.taskService.removeTask(this.taskId);
        this.isSubmitting.set(false);
        this.router.navigate(['/tenant/rooms', this.roomId()]);
      });
    }
  }
}
