import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { TenantApiService } from '../data-access/tenant-api.service';

@Component({
  selector: 'app-tenant-teacher-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-teacher-create.component.html',
  styleUrl: './tenant-teacher-create.component.css'})
export class TenantTeacherCreateComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private taskService = inject(TaskService);
  private tenantApi = inject(TenantApiService);

  isSubmitting = signal(false);
  showPassword = signal(false);
  teacherId = signal<string | null>(null);
  isEditMode = computed(() => !!this.teacherId());
  
  private isSuccess = false;
  private taskId = 'create-teacher-task';

  teacherForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    subject: ['Physics', Validators.required],
    qualification: [''],
    password: ['Teacher123!', [Validators.required, Validators.minLength(8)]],
    forcePasswordChange: [true],
    status: ['Active'],
    joinDate: [new Date().toISOString().split('T')[0]],
    canManageAttendance: [true],
    canManageExams: [true],
    canMessageStudents: [true],
    sendWelcomeEmail: [true]
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.teacherId.set(id);
      this.taskId = `edit-teacher-${id}`;
      // In a real app, we would fetch teacher data here
      this.teacherForm.patchValue({
        fullName: 'Dr. Ahmed Zewail',
        email: 'zewail@center.edu',
        subject: 'Physics',
        qualification: 'PhD in Physics'
      });
      this.teacherForm.get('password')?.clearValidators();
      this.teacherForm.get('password')?.updateValueAndValidity();
    }

    // Restore task data if exists
    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask && savedTask.data) {
      this.teacherForm.patchValue(savedTask.data as Record<string, unknown>);
      // Remove task from service after restoring
      this.taskService.removeTask(this.taskId);
    }
  }

  ngOnDestroy() {
    // Save task if form has data and was not successfully submitted
    const value = this.teacherForm.value;
    const hasData = value.fullName !== '' || value.email !== '' || value.phone !== '';
    
    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `${this.isEditMode() ? 'Editing' : 'Adding'} Teacher: ${value.fullName || 'New Teacher'}`,
        route: this.router.url,
        data: value
      });
    }
  }

  resetForm() {
    if (confirm('Are you sure you want to clear all fields?')) {
      this.teacherForm.reset({
        subject: 'Physics',
        status: 'Active',
        joinDate: new Date().toISOString().split('T')[0],
        canManageAttendance: true,
        canManageExams: true,
        canMessageStudents: true,
        sendWelcomeEmail: true,
        forcePasswordChange: true,
        password: 'Teacher123!'
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
    if (this.teacherForm.valid) {
      this.isSubmitting.set(true);

      this.tenantApi.createOrUpdateTeacher(this.teacherForm.getRawValue()).subscribe((payload) => {
        console.log('Teacher Saved:', payload);
        this.isSuccess = true;
        this.taskService.removeTask(this.taskId);
        this.isSubmitting.set(false);
        this.router.navigate(['/tenant/teachers']);
      });
    }
  }
}
