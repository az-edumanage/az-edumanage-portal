import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { TenantStudentsDataService } from '../../data-access/tenant-students-data.service';
import { TenantParent } from '../../models/tenant-students.models';

@Component({
  selector: 'app-tenant-parents',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatIconModule],
  templateUrl: './tenant-parents.component.html',
  styleUrl: './tenant-parents.component.css',
})
export class TenantParentsComponent {
  private readonly data = inject(TenantStudentsDataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  readonly parents = signal<TenantParent[]>([]);
  readonly searchQuery = signal('');
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly pageSize = signal(5);
  readonly currentPage = signal(1);
  readonly passwordModalParent = signal<TenantParent | null>(null);
  readonly passwordSaving = signal(false);
  readonly passwordError = signal<string | null>(null);
  readonly passwordSuccess = signal<string | null>(null);
  readonly addParentModalOpen = signal(false);
  readonly addParentSaving = signal(false);
  readonly addParentError = signal<string | null>(null);
  readonly addParentSuccess = signal<string | null>(null);
  readonly editParentModalParent = signal<TenantParent | null>(null);
  readonly editParentSaving = signal(false);
  readonly editParentError = signal<string | null>(null);
  readonly deleteParentModalParent = signal<TenantParent | null>(null);
  readonly deleteParentSaving = signal(false);
  readonly deleteParentError = signal<string | null>(null);
  readonly passwordForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });
  readonly addParentForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(160)]],
    phone: ['', [Validators.maxLength(40)]],
    email: ['', [Validators.email, Validators.maxLength(160)]],
    username: ['', [Validators.required, Validators.maxLength(120)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
  });
  readonly editParentForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(160)]],
    phone: ['', [Validators.maxLength(40)]],
    email: ['', [Validators.email, Validators.maxLength(160)]],
  });

  readonly filteredParents = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return this.parents();
    }
    return this.parents().filter((parent) =>
      [
        parent.name,
        parent.phone,
        parent.email ?? '',
        ...parent.students.flatMap((student) => [student.name, student.grade]),
      ].some((value) => value.toLowerCase().includes(query)),
    );
  });

  readonly totalLinkedStudents = computed(() =>
    this.parents().reduce((total, parent) => total + parent.students.length, 0),
  );
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredParents().length / this.pageSize())));
  readonly paginatedParents = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * this.pageSize();
    return this.filteredParents().slice(start, start + this.pageSize());
  });
  readonly paginationStart = computed(() => {
    if (!this.filteredParents().length) {
      return 0;
    }
    return (Math.min(this.currentPage(), this.totalPages()) - 1) * this.pageSize() + 1;
  });
  readonly paginationEnd = computed(() =>
    Math.min(this.paginationStart() + this.paginatedParents().length - 1, this.filteredParents().length),
  );

  constructor() {
    this.loadParents();
  }

  loadParents(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.data.loadParents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (parents) => {
          this.parents.set(parents);
          this.isLoading.set(false);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message || 'Unable to load parents');
          this.parents.set([]);
          this.isLoading.set(false);
        },
      });
  }

  setSearchQuery(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  setPageSize(value: string): void {
    const nextSize = Number(value) || 5;
    this.pageSize.set(nextSize);
    this.currentPage.set(1);
  }

  previousPage(): void {
    this.currentPage.update((page) => Math.max(1, page - 1));
  }

  nextPage(): void {
    this.currentPage.update((page) => Math.min(this.totalPages(), page + 1));
  }

  openAddParentModal(): void {
    this.addParentModalOpen.set(true);
    this.addParentError.set(null);
    this.addParentSuccess.set(null);
    this.addParentForm.reset({
      fullName: '',
      phone: '',
      email: '',
      username: '',
      password: '',
    });
  }

  closeAddParentModal(): void {
    this.addParentModalOpen.set(false);
    this.addParentSaving.set(false);
    this.addParentError.set(null);
    this.addParentSuccess.set(null);
    this.addParentForm.reset({
      fullName: '',
      phone: '',
      email: '',
      username: '',
      password: '',
    });
  }

  submitAddParent(): void {
    if (this.addParentSaving()) {
      return;
    }
    if (this.addParentForm.invalid) {
      this.addParentForm.markAllAsTouched();
      return;
    }

    const formValue = this.addParentForm.getRawValue();
    this.addParentSaving.set(true);
    this.addParentError.set(null);
    this.addParentSuccess.set(null);
    this.data.createParent({
      fullName: formValue.fullName ?? '',
      phone: formValue.phone ?? '',
      email: formValue.email ?? '',
      username: formValue.username ?? '',
      password: formValue.password ?? '',
    })
      .pipe(finalize(() => this.addParentSaving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (parent) => {
          this.parents.update((parents) => [parent, ...parents]);
          this.currentPage.set(1);
          this.addParentSuccess.set('Parent added successfully');
          this.closeAddParentModal();
        },
        error: (error: Error) => this.addParentError.set(error.message || 'Unable to add parent'),
      });
  }

  openEditParentModal(parent: TenantParent): void {
    this.editParentModalParent.set(parent);
    this.editParentError.set(null);
    this.editParentForm.reset({
      fullName: parent.name,
      phone: parent.phone ?? '',
      email: parent.email ?? '',
    });
  }

  closeEditParentModal(): void {
    this.editParentModalParent.set(null);
    this.editParentSaving.set(false);
    this.editParentError.set(null);
    this.editParentForm.reset({
      fullName: '',
      phone: '',
      email: '',
    });
  }

  submitEditParent(): void {
    const parent = this.editParentModalParent();
    const parentUserId = parent?.appUserId ?? parent?.id ?? null;
    if (!parent || !parentUserId || this.editParentSaving()) {
      return;
    }
    if (this.editParentForm.invalid) {
      this.editParentForm.markAllAsTouched();
      return;
    }

    const formValue = this.editParentForm.getRawValue();
    this.editParentSaving.set(true);
    this.editParentError.set(null);
    this.data.updateParent(parentUserId, {
      fullName: formValue.fullName ?? '',
      phone: formValue.phone ?? '',
      email: formValue.email ?? '',
    })
      .pipe(finalize(() => this.editParentSaving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedParent) => {
          this.parents.update((parents) => parents.map((current) => current.id === updatedParent.id ? updatedParent : current));
          this.closeEditParentModal();
        },
        error: (error: Error) => this.editParentError.set(error.message || 'Unable to update parent'),
      });
  }

  openDeleteParentModal(parent: TenantParent): void {
    this.deleteParentModalParent.set(parent);
    this.deleteParentError.set(null);
  }

  closeDeleteParentModal(): void {
    this.deleteParentModalParent.set(null);
    this.deleteParentSaving.set(false);
    this.deleteParentError.set(null);
  }

  confirmDeleteParent(): void {
    const parent = this.deleteParentModalParent();
    const parentUserId = parent?.appUserId ?? parent?.id ?? null;
    if (!parent || !parentUserId || this.deleteParentSaving()) {
      return;
    }

    this.deleteParentSaving.set(true);
    this.deleteParentError.set(null);
    this.data.deleteParent(parentUserId)
      .pipe(finalize(() => this.deleteParentSaving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.parents.update((parents) => parents.filter((current) => current.id !== parent.id));
          if (this.currentPage() > this.totalPages()) {
            this.currentPage.set(this.totalPages());
          }
          this.closeDeleteParentModal();
        },
        error: (error: Error) => this.deleteParentError.set(error.message || 'Unable to delete parent'),
      });
  }

  canChangeParentPassword(parent: TenantParent): boolean {
    return Boolean(parent.appUserId);
  }

  openPasswordModal(parent: TenantParent): void {
    if (!this.canChangeParentPassword(parent)) {
      this.errorMessage.set('This parent does not have a linked login account.');
      return;
    }
    this.passwordModalParent.set(parent);
    this.passwordError.set(null);
    this.passwordSuccess.set(null);
    this.passwordForm.reset({ newPassword: '' });
  }

  closePasswordModal(): void {
    this.passwordModalParent.set(null);
    this.passwordSaving.set(false);
    this.passwordError.set(null);
    this.passwordSuccess.set(null);
    this.passwordForm.reset({ newPassword: '' });
  }

  submitPassword(): void {
    const parent = this.passwordModalParent();
    const parentUserId = parent?.appUserId ?? null;
    if (!parent || !parentUserId || this.passwordSaving()) {
      return;
    }
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.passwordSaving.set(true);
    this.passwordError.set(null);
    this.passwordSuccess.set(null);
    this.data.changeParentPassword(parentUserId, this.passwordForm.controls.newPassword.value ?? '')
      .pipe(finalize(() => this.passwordSaving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.passwordSuccess.set('Password updated successfully'),
        error: (error: Error) => this.passwordError.set(error.message || 'Unable to change password'),
      });
  }
}
