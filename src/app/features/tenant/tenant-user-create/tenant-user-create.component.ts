import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { TaskService } from '../../../core/services/task.service';
import { TenantApiService } from '../data-access/tenant-api.service';

@Component({
  selector: 'app-tenant-user-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-user-create.component.html',
  styleUrl: './tenant-user-create.component.css'})
export class TenantUserCreateComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private location = inject(Location);
  private taskService = inject(TaskService);
  private tenantApi = inject(TenantApiService);

  isSubmitting = false;
  private isSuccess = false;
  private taskId = 'create-user-task';

  roles = [
    { id: 'Staff', label: 'Staff', icon: 'person', description: 'Basic administrative tasks and read-only data access.' },
    { id: 'Teacher', label: 'Teacher', icon: 'school', description: 'Manage groups, attendance, and student grades.' },
    { id: 'Manager', label: 'Manager', icon: 'manage_accounts', description: 'Department management and academic reporting.' },
    { id: 'Admin', label: 'Admin', icon: 'admin_panel_settings', description: 'Full system access including billing and settings.' },
  ];

  statuses = [
    { id: 'Active', label: 'Active', color: 'bg-emerald-500' },
    { id: 'Pending', label: 'Pending', color: 'bg-amber-500' },
    { id: 'Inactive', label: 'Inactive', color: 'bg-slate-400' },
  ];

  private existingUsers = [
    { name: 'Ahmed Admin', email: 'admin@school.com' },
    { name: 'Sara Manager', email: 'sara.m@school.com' },
    { name: 'John Staff', email: 'john.s@school.com' },
  ];

  userForm = this.fb.group({
    fullName: ['', {
      validators: [Validators.required],
      asyncValidators: [this.duplicateNameValidator.bind(this)],
      updateOn: 'blur'
    }],
    email: ['', {
      validators: [Validators.required, Validators.email],
      asyncValidators: [this.duplicateEmailValidator.bind(this)],
      updateOn: 'blur'
    }],
    role: ['Staff', [Validators.required]],
    status: ['Pending', [Validators.required]],
    sendInvite: [true],
    password: ['']
  });

  ngOnInit() {
    // Restore task data if exists
    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask && savedTask.data) {
      this.userForm.patchValue(savedTask.data);
      // Remove task from service after restoring
      this.taskService.removeTask(this.taskId);
    }
  }

  ngOnDestroy() {
    // Save task if form has data and was not successfully submitted
    const value = this.userForm.value;
    const hasData = Object.values(value).some(v => v !== '' && v !== null && v !== true && v !== 'Staff' && v !== 'Pending');
    
    if (hasData && !this.isSuccess && !this.isSubmitting) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `Adding User: ${value.fullName || 'New User'}`,
        route: '/tenant/users/create',
        data: value
      });
    }
  }

  resetForm() {
    if (confirm('Are you sure you want to clear all fields?')) {
      this.userForm.reset({
        role: 'Staff',
        status: 'Pending',
        sendInvite: true
      });
      this.taskService.removeTask(this.taskId);
    }
  }

  goBack() {
    this.isSuccess = true;
    this.taskService.removeTask(this.taskId);
    this.location.back();
  }

  duplicateNameValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    if (!control.value) return of(null);
    return of(control.value).pipe(
      delay(800),
      map(value => {
        const exists = this.existingUsers.some(u => u.name.toLowerCase() === value.toLowerCase());
        return exists ? { duplicateName: true } : null;
      }),
      catchError(() => of(null))
    );
  }

  duplicateEmailValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    if (!control.value) return of(null);
    return of(control.value).pipe(
      delay(800),
      map(value => {
        const exists = this.existingUsers.some(u => u.email.toLowerCase() === value.toLowerCase());
        return exists ? { duplicateEmail: true } : null;
      }),
      catchError(() => of(null))
    );
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.isSubmitting = true;

      this.tenantApi.createUser(this.userForm.getRawValue()).subscribe((payload) => {
        console.log('User Created:', payload);
        this.isSuccess = true;
        this.taskService.removeTask(this.taskId);
        this.isSubmitting = false;
        this.router.navigate(['/tenant/users']);
      });
    } else {
      this.userForm.markAllAsTouched();
    }
  }
}
