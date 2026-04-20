import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-tenant-room-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-room-create.component.html',
  styleUrl: './tenant-room-create.component.css'})
export class TenantRoomCreateComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);

  isSubmitting = signal(false);
  roomId = signal<string | null>(null);
  isEditMode = computed(() => !!this.roomId());
  availableEquipment = ['Projector', 'AC', 'Whiteboard', 'Sound System', 'Stage', 'Lab Kits', 'Safety Gear', 'Zoom Integration', 'Recording'];

  private isSuccess = false;
  private taskId = 'create-room-task';

  roomForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    type: ['Classroom', Validators.required],
    capacity: [30, [Validators.required, Validators.min(1)]],
    equipment: [[] as string[]],
    notes: ['']
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.roomId.set(id);
      this.taskId = `edit-room-${id}`;
      // Mock data for edit mode
      this.roomForm.patchValue({
        name: id === '2' ? 'Physics Lab' : 'Room 101',
        type: id === '2' ? 'Laboratory' : 'Classroom',
        capacity: id === '2' ? 20 : 30,
        equipment: id === '2' ? ['Lab Kits', 'Projector', 'Safety Gear'] : ['Projector', 'AC', 'Whiteboard'],
        notes: 'This room is equipped with high-speed internet and modern teaching aids.'
      });
    }

    // Restore task data if exists
    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask && savedTask.data) {
      this.roomForm.patchValue(savedTask.data as Record<string, unknown>);
      // Remove task from service after restoring
      this.taskService.removeTask(this.taskId);
    }
  }

  ngOnDestroy() {
    // Save task if form has data and was not successfully submitted
    const value = this.roomForm.value;
    const hasData = value.name !== '' || value.notes !== '';
    
    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `${this.isEditMode() ? 'Editing' : 'Creating'} Room: ${value.name || 'New Room'}`,
        route: this.router.url,
        data: value
      });
    }
  }

  isEquipmentSelected(item: string): boolean {
    const equipment = this.roomForm.get('equipment')?.value as string[];
    return equipment?.includes(item) || false;
  }

  onEquipmentChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const equipment = [...(this.roomForm.get('equipment')?.value as string[])];
    if (target.checked) {
      if (!equipment.includes(target.value)) {
        equipment.push(target.value);
      }
    } else {
      const index = equipment.indexOf(target.value);
      if (index > -1) equipment.splice(index, 1);
    }
    this.roomForm.patchValue({ equipment });
  }

  onCancel() {
    this.isSuccess = true;
    this.taskService.removeTask(this.taskId);
    this.router.navigate(['/tenant/rooms']);
  }

  onSubmit() {
    if (this.roomForm.valid) {
      this.isSubmitting.set(true);
      // Simulate API call
      setTimeout(() => {
        console.log('Room Saved:', this.roomForm.value);
        this.isSuccess = true;
        this.taskService.removeTask(this.taskId);
        this.isSubmitting.set(false);
        this.router.navigate(['/tenant/rooms']);
      }, 1500);
    }
  }
}
