import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-owner-user-form',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './owner-user-form.component.html'})
export class OwnerUserFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private taskService = inject(TaskService);
  
  isEditMode = false;
  userForm: FormGroup;
  private isSuccess = false;
  private taskId = '';

  constructor() {
    this.userForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      role: ['Support Agent', Validators.required],
      requireMfa: [false],
      expiryDate: [''],
      ipRestriction: ['']
    });
  }

  ngOnInit() {
    // Check if editing
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.isEditMode = true;
      this.taskId = `edit-user-task-${userId}`;
      // Load user data (mock)
      if (userId === 'usr-1') {
        this.userForm.patchValue({
          fullName: 'Ahmed Hassan',
          email: 'ahmed.hassan@platform.com',
          role: 'Super Admin',
          requireMfa: true
        });
      }
    } else {
      this.taskId = 'create-owner-user-task';
    }

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
    const hasData = value.fullName !== '' || value.email !== '';
    
    if (hasData && !this.isSuccess) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `${this.isEditMode ? 'Editing' : 'Creating'} User: ${value.fullName || 'New User'}`,
        route: this.router.url,
        data: value
      });
    }
  }

  onCancel() {
    this.isSuccess = true;
    this.taskService.removeTask(this.taskId);
    this.router.navigate(['/owner/users']);
  }

  getPermissionsForRole(role: string): string[] {
    switch (role) {
      case 'Super Admin':
        return ['Manage Tenants', 'Manage Billing', 'Manage Modules', 'Manage Provisioning', 'View Monitoring', 'Impersonate Tenant', 'View Audit Logs', 'Manage Users'];
      case 'Support Agent':
        return ['Manage Tenants', 'View Monitoring', 'Impersonate Tenant', 'View Audit Logs'];
      case 'Billing Manager':
        return ['Manage Billing', 'View Audit Logs'];
      case 'Developer':
        return ['View Monitoring', 'View Audit Logs', 'Manage Integrations'];
      default:
        return [];
    }
  }

  saveUser() {
    if (this.userForm.valid) {
      console.log('Saving user:', this.userForm.value);
      this.isSuccess = true;
      this.taskService.removeTask(this.taskId);
      // In a real app, call service to save
      this.router.navigate(['/owner/users']);
    }
  }
}
