import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TenantTeacherCreateFacade } from '../../state/tenant-teacher-create.facade';

@Component({
  selector: 'app-tenant-teacher-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-teacher-create.component.html',
  styleUrl: './tenant-teacher-create.component.css'})
export class TenantTeacherCreateComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly facade = inject(TenantTeacherCreateFacade);

  readonly isSubmitting = this.facade.isSubmitting;
  readonly showPassword = this.facade.showPassword;
  readonly teacherId = this.facade.teacherId;
  readonly isEditMode = this.facade.isEditMode;
  readonly teacherForm = this.facade.teacherForm;

  ngOnInit(): void {
    this.facade.initialize(this.route.snapshot.paramMap.get('id'));
  }

  ngOnDestroy(): void {
    this.facade.onDestroy(this.router.url);
  }

  resetForm(): void {
    if (confirm('Are you sure you want to clear all fields?')) {
      this.facade.resetForm();
    }
  }

  goBack(): void {
    this.facade.cancelDraft();
    this.location.back();
  }

  onSubmit(): void {
    this.facade.onSubmit();
  }
}
