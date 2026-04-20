import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { TenantApiService } from '../data-access/tenant-api.service';

interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
}

@Component({
  selector: 'app-tenant-group-student-add',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-group-student-add.component.html',
  styleUrl: './tenant-group-student-add.component.css'})
export class TenantGroupStudentAddComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);
  private tenantApi = inject(TenantApiService);

  groupId = signal<string | null>(null);
  isSubmitting = signal(false);
  selectedStudent = signal<Student | null>(null);
  
  private isSuccess = false;
  private taskId = '';

  allStudents: Student[] = [
    { id: '101', name: 'Ahmed Ali', email: 'ahmed@example.com', grade: 'Grade 12' },
    { id: '102', name: 'Sara Mohamed', email: 'sara@example.com', grade: 'Grade 12' },
    { id: '103', name: 'Omar Hassan', email: 'omar@example.com', grade: 'Grade 11' },
    { id: '104', name: 'Laila Mahmoud', email: 'laila@example.com', grade: 'Grade 12' },
    { id: '105', name: 'Youssef Ibrahim', email: 'youssef@example.com', grade: 'Grade 10' },
  ];
  
  filteredStudents = signal<Student[]>([]);

  enrollForm = this.fb.group({
    enrollDate: [new Date().toISOString().split('T')[0], Validators.required],
    discount: [0, [Validators.min(0), Validators.max(100)]],
    sendNotification: [true],
    generateInitialInvoice: [true]
  });

  ngOnInit() {
    const groupId = this.route.snapshot.paramMap.get('id');
    this.groupId.set(groupId);
    this.taskId = `enroll-student-group-${groupId}`;
    this.filteredStudents.set(this.allStudents);

    // Restore task data if exists
    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask && savedTask.data) {
      const data = savedTask.data as Record<string, unknown>;
      const formData = data['form'] as Record<string, unknown>;
      this.enrollForm.patchValue(formData);
      if (data['selectedStudent']) {
        this.selectedStudent.set(data['selectedStudent'] as Student);
      }
      // Remove task from service after restoring
      this.taskService.removeTask(this.taskId);
    }
  }

  ngOnDestroy() {
    // Save task if form has data or student selected and was not successfully submitted
    const value = this.enrollForm.value;
    const hasData = this.selectedStudent() !== null;
    
    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `Enrolling Student: ${this.selectedStudent()?.name || 'Unknown'}`,
        route: this.router.url,
        data: {
          form: value,
          selectedStudent: this.selectedStudent()
        }
      });
    }
  }

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    if (!query) {
      this.filteredStudents.set(this.allStudents);
      return;
    }
    this.filteredStudents.set(
      this.allStudents.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.email.toLowerCase().includes(query) || 
        s.id.includes(query)
      )
    );
  }

  selectStudent(student: Student) {
    this.selectedStudent.set(student);
  }

  onEnroll() {
    if (this.selectedStudent()) {
      this.isSubmitting.set(true);
      const payload = {
        ...this.enrollForm.getRawValue(),
        student: this.selectedStudent(),
      };
      this.tenantApi.enrollStudentToGroup(payload).subscribe((response) => {
        console.log('Enrolled:', response);
        this.isSuccess = true;
        this.taskService.removeTask(this.taskId);
        this.isSubmitting.set(false);
        this.router.navigate(['/tenant/groups', this.groupId()]);
      });
    }
  }

  onCancel() {
    this.isSuccess = true;
    this.taskService.removeTask(this.taskId);
    this.router.navigate(['/tenant/groups', this.groupId()]);
  }
}
