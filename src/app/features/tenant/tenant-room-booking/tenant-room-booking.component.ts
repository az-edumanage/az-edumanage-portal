import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TenantRoomBookingFacade } from '../state/tenant-room-booking.facade';

@Component({
  selector: 'app-tenant-room-booking',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-room-booking.component.html',
  styleUrl: './tenant-room-booking.component.css'})
export class TenantRoomBookingComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly facade = inject(TenantRoomBookingFacade);

  readonly roomId = this.facade.roomId;
  readonly roomName = this.facade.roomName;
  readonly isSubmitting = this.facade.isSubmitting;
  readonly bookingForm = this.facade.bookingForm;

  ngOnInit(): void {
    this.facade.initialize(this.route.snapshot.paramMap.get('id'));
  }

  ngOnDestroy(): void {
    this.facade.onDestroy(this.router.url);
  }

  onCancel(): void {
    this.facade.onCancel();
  }

  onSubmit(): void {
    this.facade.onSubmit();
  }
}
