import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TenantStudentCreateFacade } from '../../state/tenant-student-create.facade';

@Component({
  selector: 'app-tenant-student-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-student-create.component.html',
  styleUrl: './tenant-student-create.component.css'})
export class TenantStudentCreateComponent implements OnInit, OnDestroy {
  private readonly location = inject(Location);
  private readonly facade = inject(TenantStudentCreateFacade);

  readonly isSubmitting = this.facade.isSubmitting;
  readonly studentForm = this.facade.studentForm;

  ngOnInit(): void {
    this.facade.initialize();
  }

  ngOnDestroy(): void {
    this.facade.onDestroy();
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
