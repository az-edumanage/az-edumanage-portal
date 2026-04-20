import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OwnerUserFormFacade } from '../../state/owner-user-form.facade';

@Component({
  selector: 'app-owner-user-form',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './owner-user-form.component.html'})
export class OwnerUserFormComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly facade = inject(OwnerUserFormFacade);

  readonly userForm = this.facade.userForm;

  get isEditMode(): boolean {
    return this.facade.isEditMode();
  }

  ngOnInit(): void {
    this.facade.initialize(this.route.snapshot.paramMap.get('id'));
  }

  ngOnDestroy(): void {
    this.facade.onDestroy(this.router.url);
  }

  onCancel(): void {
    this.facade.onCancel();
  }

  getPermissionsForRole(role: string | null | undefined): string[] {
    return this.facade.getPermissionsForRole(role ?? '');
  }

  saveUser(): void {
    this.facade.saveUser();
  }
}
