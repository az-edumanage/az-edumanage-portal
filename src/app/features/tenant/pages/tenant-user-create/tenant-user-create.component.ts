import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TenantUserCreateFacade } from '../../state/tenant-user-create.facade';

@Component({
  selector: 'app-tenant-user-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-user-create.component.html',
  styleUrl: './tenant-user-create.component.css'})
export class TenantUserCreateComponent implements OnInit, OnDestroy {
  private readonly facade = inject(TenantUserCreateFacade);

  readonly roles = this.facade.roles;
  readonly statuses = this.facade.statuses;
  readonly userForm = this.facade.userForm;

  get isSubmitting(): boolean {
    return this.facade.isSubmitting;
  }

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
