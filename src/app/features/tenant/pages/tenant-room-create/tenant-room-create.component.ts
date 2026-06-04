import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TenantRoomCreateFacade } from '../../state/tenant-room-create.facade';

@Component({
  selector: 'app-tenant-room-create',
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-room-create.component.html',
  styleUrl: './tenant-room-create.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantRoomCreateComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly facade = inject(TenantRoomCreateFacade);

  readonly isSubmitting = this.facade.isSubmitting;
  readonly isLoadingLookups = this.facade.isLoadingLookups;
  readonly submitError = this.facade.submitError;
  readonly roomId = this.facade.roomId;
  readonly isEditMode = this.facade.isEditMode;
  readonly availableRoomTypes = this.facade.availableRoomTypes;
  readonly availableEquipment = this.facade.availableEquipment;
  readonly roomForm = this.facade.roomForm;

  ngOnInit(): void {
    this.facade.initialize(this.route.snapshot.paramMap.get('id'));
  }

  ngOnDestroy(): void {
    this.facade.onDestroy(this.router.url);
  }

  isEquipmentSelected(item: string): boolean {
    return this.facade.isEquipmentSelected(item);
  }

  onEquipmentChange(event: Event): void {
    this.facade.onEquipmentChange(event);
  }

  onCancel(): void {
    this.facade.onCancel();
  }

  onSubmit(): void {
    this.facade.onSubmit();
  }
}
