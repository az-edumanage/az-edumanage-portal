import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { TenantRoomBookingDataService } from '../data-access/tenant-room-booking-data.service';
import { TenantRoomBookingStore } from './tenant-room-booking.store';
import { TenantRoomBookingForm } from '../models/tenant-room-booking.models';

@Injectable({ providedIn: 'root' })
export class TenantRoomBookingFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly data = inject(TenantRoomBookingDataService);
  private readonly store = inject(TenantRoomBookingStore);

  private isSuccess = false;

  readonly roomId = this.store.roomId;
  readonly roomName = this.store.roomName;
  readonly isSubmitting = this.store.isSubmitting;

  readonly bookingForm = this.fb.group({
    purpose: ['', [Validators.required, Validators.minLength(3)]],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    teacher: ['', Validators.required],
    startTime: ['10:00', Validators.required],
    endTime: ['11:30', Validators.required],
    isRecurring: [false],
  });

  initialize(roomId: string | null): void {
    this.store.setRoomId(roomId);
    this.store.setRoomName(this.data.getRoomName(roomId));

    const savedTask = this.taskService.getTask(this.store.taskId());
    if (savedTask?.data) {
      this.bookingForm.patchValue(savedTask.data as Partial<TenantRoomBookingForm>);
      this.taskService.removeTask(this.store.taskId());
    }
  }

  onDestroy(currentRoute: string): void {
    const value = this.bookingForm.getRawValue();
    const hasData = value.purpose !== '' || value.teacher !== '';

    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.store.taskId(),
        type: 'form',
        label: `Booking Room: ${this.roomName()}`,
        route: currentRoute,
        data: value,
      });
    }
  }

  onCancel(): void {
    this.isSuccess = true;
    this.taskService.removeTask(this.store.taskId());
    this.router.navigate(['/tenant/rooms', this.roomId()]);
  }

  onSubmit(): void {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    this.store.setSubmitting(true);

    this.data
      .bookRoom(this.bookingForm.getRawValue() as TenantRoomBookingForm)
      .pipe(finalize(() => this.store.setSubmitting(false)))
      .subscribe(() => {
        this.isSuccess = true;
        this.taskService.removeTask(this.store.taskId());
        this.router.navigate(['/tenant/rooms', this.roomId()]);
      });
  }
}
