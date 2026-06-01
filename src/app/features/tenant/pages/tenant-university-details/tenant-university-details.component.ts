import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantUniversity } from '../../models/tenant-universities.models';
import { TenantUniversitiesFacade } from '../../state/tenant-universities.facade';

@Component({
  selector: 'app-tenant-university-details',
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-university-details.component.html',
  styleUrl: './tenant-university-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantUniversityDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantUniversitiesFacade);

  readonly university = signal<TenantUniversity | null>(null);
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;
  readonly deleteError = this.facade.deleteError;
  readonly deletingId = this.facade.deletingId;
  readonly confirmDeleteOpen = signal(false);
  readonly statusModal = signal<{ title: string; message: string; icon: string; action: 'close' | 'list' } | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    this.university.set(id ? await this.facade.getUniversity(id) : null);
  }

  requestDeleteUniversity(): void {
    const university = this.university();
    if (!university) {
      return;
    }
    this.statusModal.set(null);
    this.confirmDeleteOpen.set(true);
  }

  closeDeleteConfirmation(): void {
    if (this.deletingId()) {
      return;
    }
    this.confirmDeleteOpen.set(false);
  }

  async confirmDeleteUniversity(): Promise<void> {
    const university = this.university();
    if (!university || this.deletingId()) {
      return;
    }
    if (await this.facade.deleteUniversity(university.id)) {
      this.confirmDeleteOpen.set(false);
      this.statusModal.set({
        title: 'University deleted',
        message: 'The university was deleted successfully.',
        icon: 'check_circle',
        action: 'list',
      });
    }
  }

  async closeStatusModal(): Promise<void> {
    const status = this.statusModal();
    this.statusModal.set(null);
    if (status?.action === 'list') {
      await this.facade.goToList();
    }
  }
}
