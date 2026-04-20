import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-tenant-student-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-student-create.component.html',
  styleUrl: './tenant-student-create.component.css'})
export class TenantStudentCreateComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private location = inject(Location);
  private taskService = inject(TaskService);

  isSubmitting = signal(false);
  private isSuccess = false;
  private taskId = 'create-student-task';

  studentForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    birthDate: [''],
    gender: ['Male'],
    parentName: ['', Validators.required],
    parentPhone: ['', Validators.required],
    address: [''],
    grade: ['Grade 10', Validators.required],
    enrollmentType: ['Full-time'],
    isActive: [true],
    notifyParent: [true],
    notifySMS: [false]
  });

  ngOnInit() {
    // Restore task data if exists
    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask && savedTask.data) {
      this.studentForm.patchValue(savedTask.data as Record<string, unknown>);
      // Remove task from service after restoring
      this.taskService.removeTask(this.taskId);
    }
  }

  ngOnDestroy() {
    // Save task if form has data and was not successfully submitted
    const value = this.studentForm.value;
    const hasData = value.fullName !== '' || value.email !== '' || value.parentName !== '';
    
    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `Enrolling Student: ${value.fullName || 'New Student'}`,
        route: '/tenant/students/create',
        data: value
      });
    }
  }

  resetForm() {
    if (confirm('Are you sure you want to clear all fields?')) {
      this.studentForm.reset({
        gender: 'Male',
        grade: 'Grade 10',
        enrollmentType: 'Full-time',
        isActive: true,
        notifyParent: true,
        notifySMS: false
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
    if (this.studentForm.valid) {
      this.isSubmitting.set(true);
      
      setTimeout(() => {
        console.log('Student Enrolled:', this.studentForm.value);
        this.isSuccess = true;
        this.taskService.removeTask(this.taskId);
        this.isSubmitting.set(false);
        this.router.navigate(['/tenant/students']);
      }, 1500);
    }
  }
}
