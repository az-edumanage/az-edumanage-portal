import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TenantGradeCreateFacade } from '../state/tenant-grade-create.facade';

@Component({
  selector: 'app-tenant-grade-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-grade-create.component.html'})
export class TenantGradeCreateComponent implements OnInit, OnDestroy {
  private readonly facade = inject(TenantGradeCreateFacade);

  readonly isSubmitting = this.facade.isSubmitting;
  readonly gradeForm = this.facade.gradeForm;

  ngOnInit(): void {
    this.facade.initialize();
  }

  ngOnDestroy(): void {
    this.facade.onDestroy();
  }

  resetForm(): void {
    this.facade.resetForm();
  }

  goBack(): void {
    this.facade.goBack();
  }

  onSubmit(): void {
    this.facade.onSubmit();
  }
}
