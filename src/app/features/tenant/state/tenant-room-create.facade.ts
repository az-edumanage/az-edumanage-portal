import { Injectable, computed, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { TenantRoomCreateDataService } from '../data-access/tenant-room-create-data.service';
import { TenantRoomCreatePayload } from '../models/tenant-room-create.models';
import { TenantRoomCreateStore } from './tenant-room-create.store';

@Injectable({ providedIn: 'root' })
export class TenantRoomCreateFacade {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly data = inject(TenantRoomCreateDataService);
  private readonly store = inject(TenantRoomCreateStore);

  private isSuccess = false;

  readonly isSubmitting = this.store.isSubmitting;
  readonly roomId = this.store.roomId;
  readonly isEditMode = this.store.isEditMode;
  readonly availableEquipment = this.data.availableEquipment;

  readonly roomForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    type: ['Classroom', Validators.required],
    capacity: [30, [Validators.required, Validators.min(1)]],
    equipment: [[] as string[]],
    notes: [''],
  });

  readonly taskId = computed(() => this.store.taskId());

  initialize(roomId: string | null): void {
    this.store.setRoomId(roomId);

    if (roomId) {
      this.roomForm.patchValue(this.data.getRoomForEdit(roomId));
    }

    const savedTask = this.taskService.getTask(this.taskId());
    if (savedTask?.data) {
      this.roomForm.patchValue(savedTask.data as Partial<TenantRoomCreatePayload>);
      this.taskService.removeTask(this.taskId());
    }
  }

  onDestroy(currentRoute: string): void {
    const value = this.roomForm.getRawValue();
    const hasData = value.name !== '' || value.notes !== '';

    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.taskId(),
        type: 'form',
        label: `${this.isEditMode() ? 'Editing' : 'Creating'} Room: ${value.name || 'New Room'}`,
        route: currentRoute,
        data: value,
      });
    }
  }

  isEquipmentSelected(item: string): boolean {
    const equipment = this.roomForm.get('equipment')?.value as string[];
    return equipment?.includes(item) || false;
  }

  onEquipmentChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const equipment = [...(this.roomForm.get('equipment')?.value as string[])];

    if (target.checked) {
      if (!equipment.includes(target.value)) {
        equipment.push(target.value);
      }
    } else {
      const index = equipment.indexOf(target.value);
      if (index > -1) {
        equipment.splice(index, 1);
      }
    }

    this.roomForm.patchValue({ equipment });
  }

  onCancel(): void {
    this.isSuccess = true;
    this.taskService.removeTask(this.taskId());
    this.router.navigate(['/tenant/rooms']);
  }

  onSubmit(): void {
    if (this.roomForm.invalid) {
      this.roomForm.markAllAsTouched();
      return;
    }

    this.store.setSubmitting(true);
    const payload = this.roomForm.getRawValue() as TenantRoomCreatePayload;

    this.data
      .createOrUpdateRoom(payload)
      .pipe(finalize(() => this.store.setSubmitting(false)))
      .subscribe(() => {
        this.isSuccess = true;
        this.taskService.removeTask(this.taskId());
        this.router.navigate(['/tenant/rooms']);
      });
  }
}
