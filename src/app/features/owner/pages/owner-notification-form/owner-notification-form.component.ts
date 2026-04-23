import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OwnerNotificationFormFacade } from '../../state/owner-notification-form.facade';

@Component({
  selector: 'app-owner-notification-form',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './owner-notification-form.component.html',
  styleUrl: './owner-notification-form.component.css'})
export class OwnerNotificationFormComponent implements OnInit, OnDestroy {
  private readonly facade = inject(OwnerNotificationFormFacade);

  readonly notificationForm = this.facade.notificationForm;

  ngOnInit(): void {
    this.facade.initialize();
  }

  ngOnDestroy(): void {
    this.facade.onDestroy();
  }

  onCancel(): void {
    this.facade.onCancel();
  }

  onSave(): void {
    this.facade.onSave();
  }
}
