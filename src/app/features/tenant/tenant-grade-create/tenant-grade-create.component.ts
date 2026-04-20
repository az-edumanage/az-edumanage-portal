import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { TenantApiService } from '../data-access/tenant-api.service';

@Component({
  selector: 'app-tenant-grade-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-grade-create.component.html'})
export class TenantGradeCreateComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private location = inject(Location);
  private taskService = inject(TaskService);
  private tenantApi = inject(TenantApiService);

  isSubmitting = signal(false);
  private isSuccess = false;
  private taskId = 'create-grade-task';

  gradeForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    level: ['Secondary', Validators.required],
    description: ['']
  });

  ngOnInit() {
    // Restore task data if exists
    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask && savedTask.data) {
      this.gradeForm.patchValue(savedTask.data as Record<string, unknown>);
      // Remove task from service after restoring
      this.taskService.removeTask(this.taskId);
    }
  }

  ngOnDestroy() {
    // Save task if form has data and was not successfully submitted
    const value = this.gradeForm.value;
    const hasData = value.name !== '' || value.description !== '' || value.level !== 'Secondary';
    
    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `Creating Grade: ${value.name || 'New Grade'}`,
        route: '/tenant/grades/create',
        data: value
      });
    }
  }

  resetForm() {
    if (confirm('Are you sure you want to clear all fields?')) {
      this.gradeForm.reset({
        level: 'Secondary'
      });
      this.taskService.removeTask(this.taskId);
    }
  }

  goBack() {
    this.isSuccess = true;
    this.taskService.removeTask(this.taskId);
    this.location.back();
  }

  onSubmit() {
    if (this.gradeForm.valid) {
      this.isSubmitting.set(true);

      this.tenantApi.createGrade(this.gradeForm.getRawValue()).subscribe((payload) => {
        console.log('Grade Created:', payload);
        this.isSuccess = true;
        this.taskService.removeTask(this.taskId);
        this.isSubmitting.set(false);
        this.router.navigate(['/tenant/grades']);
      });
    }
  }
}
