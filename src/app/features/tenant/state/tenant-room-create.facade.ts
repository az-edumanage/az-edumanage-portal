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
  readonly isLoadingLookups = this.store.isLoadingLookups;
  readonly submitError = this.store.submitError;
  readonly roomId = this.store.roomId;
  readonly isEditMode = this.store.isEditMode;
  readonly availableRoomTypes = this.data.availableRoomTypes;
  readonly availableEquipment = this.data.availableEquipment;

  readonly roomForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    type: ['', Validators.required],
    capacity: [30, [Validators.required, Validators.min(1)]],
    equipment: [[] as string[]],
    notes: [''],
  });

  readonly taskId = computed(() => this.store.taskId());

  initialize(roomId: string | null): void {
    this.store.setRoomId(roomId);

    void this.initializeForm(roomId);
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
    this.store.setSubmitError(null);
    if (this.roomForm.invalid) {
      this.roomForm.markAllAsTouched();
      return;
    }

    if (!this.hasAvailableRoomType()) {
      this.roomForm.get('type')?.setErrors({ unavailable: true });
      this.roomForm.get('type')?.markAsTouched();
      this.store.setSubmitError('Select an available room type.');
      return;
    }

    this.store.setSubmitting(true);
    const payload = this.roomForm.getRawValue() as TenantRoomCreatePayload;

    this.data
      .createOrUpdateRoom(payload, this.roomId())
      .pipe(finalize(() => this.store.setSubmitting(false)))
      .subscribe({
        next: () => {
          this.isSuccess = true;
          this.taskService.removeTask(this.taskId());
          this.router.navigate(['/tenant/rooms']);
        },
        error: (error: Error) => {
          this.store.setSubmitError(error.message || 'Unable to save room. Please try again.');
        },
      });
  }

  private async initializeForm(roomId: string | null): Promise<void> {
    this.store.setLoadingLookups(true);
    this.store.setSubmitError(null);
    try {
      await this.data.loadLookups();

      if (roomId) {
        this.roomForm.patchValue(await this.data.getRoomForEdit(roomId));
      } else {
        const roomTypes = this.availableRoomTypes();
        const currentType = this.roomForm.get('type')?.value;
        if (roomTypes.length > 0 && (!currentType || !roomTypes.includes(currentType))) {
          this.roomForm.patchValue({ type: roomTypes[0] });
        }
      }

      const savedTask = this.taskService.getTask(this.taskId());
      if (savedTask?.data) {
        this.roomForm.patchValue(savedTask.data as Partial<TenantRoomCreatePayload>);
        this.taskService.removeTask(this.taskId());
      }

      if (!this.hasAvailableRoomType()) {
        this.roomForm.patchValue({ type: this.availableRoomTypes()[0] ?? '' });
      }
    } catch (error) {
      this.store.setSubmitError(error instanceof Error ? error.message : 'Unable to load room settings.');
    } finally {
      this.store.setLoadingLookups(false);
    }
  }

  private hasAvailableRoomType(): boolean {
    const type = this.roomForm.get('type')?.value?.trim();
    return !!type && this.availableRoomTypes().includes(type);
  }
}
