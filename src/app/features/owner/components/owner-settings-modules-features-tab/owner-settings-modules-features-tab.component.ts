import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  OwnerModuleFeatureSetting,
  OwnerModuleFeaturesSettingsDataService,
} from '../../data-access/owner-module-features-settings-data.service';

@Component({
  selector: 'app-owner-settings-modules-features-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './owner-settings-modules-features-tab.component.html',
  styleUrl: './owner-settings-modules-features-tab.component.css',
})
export class OwnerSettingsModulesFeaturesTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(OwnerModuleFeaturesSettingsDataService);

  readonly features = this.data.features;
  readonly query = signal('');
  readonly filteredFeatures = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) {
      return this.features();
    }

    return this.features().filter((item) =>
      item.nameAr.toLowerCase().includes(q) ||
      item.nameEn.toLowerCase().includes(q) ||
      item.moduleCategory.toLowerCase().includes(q) ||
      item.price.toString().includes(q),
    );
  });
  readonly loading = this.data.loading;
  readonly showModal = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly pendingDelete = signal<OwnerModuleFeatureSetting | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly modalTitle = computed(() => this.editingId() ? 'Edit Module Feature' : 'Add Module Feature');
  readonly modalSubmitLabel = computed(() => this.editingId() ? 'Save Changes' : 'Create Feature');

  readonly form = this.fb.group({
    nameAr: ['', Validators.required],
    nameEn: ['', Validators.required],
    moduleCategory: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    enabled: [true, Validators.required],
  });

  async onStatusToggle(item: OwnerModuleFeatureSetting, checked: boolean): Promise<void> {
    await this.data.toggleFeature(item.id, checked);
  }

  onSearch(query: string): void {
    this.query.set(query);
  }

  openCreateModal(): void {
    this.editingId.set(null);
    this.form.reset({
      nameAr: '',
      nameEn: '',
      moduleCategory: '',
      price: 0,
      enabled: true,
    });
    this.showModal.set(true);
  }

  openEditModal(item: OwnerModuleFeatureSetting): void {
    this.editingId.set(item.id);
    this.form.reset({
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      moduleCategory: item.moduleCategory,
      price: item.price,
      enabled: item.enabled,
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      nameAr: (this.form.controls.nameAr.value ?? '').trim(),
      nameEn: (this.form.controls.nameEn.value ?? '').trim(),
      moduleCategory: (this.form.controls.moduleCategory.value ?? '').trim(),
      price: Number(this.form.controls.price.value ?? 0),
      enabled: !!this.form.controls.enabled.value,
    };

    this.submitting.set(true);
    try {
      const editingId = this.editingId();
      if (editingId) {
        await this.data.updateFeature({ id: editingId, ...payload });
      } else {
        await this.data.createFeature(payload);
      }
      await this.data.reload();
      this.closeModal();
    } finally {
      this.submitting.set(false);
    }
  }

  openDeleteConfirm(item: OwnerModuleFeatureSetting): void {
    this.pendingDelete.set(item);
  }

  closeDeleteConfirm(): void {
    if (this.deletingId()) {
      return;
    }
    this.pendingDelete.set(null);
  }

  async confirmDeleteFeature(): Promise<void> {
    const item = this.pendingDelete();
    if (!item) {
      return;
    }

    this.deletingId.set(item.id);
    try {
      await this.data.deleteFeature(item.id);
      this.pendingDelete.set(null);
    } finally {
      this.deletingId.set(null);
    }
  }
}
