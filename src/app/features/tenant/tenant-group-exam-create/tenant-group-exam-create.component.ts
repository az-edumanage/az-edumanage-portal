import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { TenantApiService } from '../data-access/tenant-api.service';

@Component({
  selector: 'app-tenant-group-exam-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-group-exam-create.component.html',
  styleUrl: './tenant-group-exam-create.component.css'})
export class TenantGroupExamCreateComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);
  private tenantApi = inject(TenantApiService);

  groupId = signal<string | null>(null);
  isSubmitting = signal(false);

  private isSuccess = false;
  private taskId = '';

  examForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    duration: [60, [Validators.required, Validators.min(1)]],
    instructions: [''],
    saveToCenterBank: [true],
    saveToMyMedia: [true],
    shuffleQuestions: [true],
    showResultsImmediately: [false],
    allowRetakes: [false]
  });

  ngOnInit() {
    const groupId = this.route.snapshot.paramMap.get('id');
    this.groupId.set(groupId);
    this.taskId = `create-exam-group-${groupId}`;

    // Restore task data if exists
    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask && savedTask.data) {
      this.examForm.patchValue(savedTask.data as Record<string, unknown>);
      // Remove task from service after restoring
      this.taskService.removeTask(this.taskId);
    }
  }

  ngOnDestroy() {
    // Save task if form has data and was not successfully submitted
    const value = this.examForm.value;
    const hasData = value.title !== '' || value.instructions !== '';
    
    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `Creating Exam: ${value.title || 'New Exam'}`,
        route: this.router.url,
        data: value
      });
    }
  }

  onCancel() {
    this.isSuccess = true;
    this.taskService.removeTask(this.taskId);
    this.router.navigate(['/tenant/groups', this.groupId()]);
  }

  onSubmit() {
    if (this.examForm.valid) {
      this.isSubmitting.set(true);
      this.tenantApi.createGroupExam(this.examForm.getRawValue()).subscribe((payload) => {
        console.log('Exam Created:', payload);
        this.isSuccess = true;
        this.taskService.removeTask(this.taskId);
        this.isSubmitting.set(false);
        this.router.navigate(['/tenant/groups', this.groupId()]);
      });
    }
  }
}
