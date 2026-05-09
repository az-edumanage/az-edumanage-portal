import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OwnerModulesDataService } from '../../data-access/owner-modules-data.service';
import { ModuleCategory, ModuleStatus } from '../../models/owner-modules.models';

@Component({
  selector: 'app-owner-module-create',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, MatIconModule],
  templateUrl: './owner-module-create.component.html',
  styleUrl: './owner-module-create.component.css',
})
export class OwnerModuleCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly modulesData = inject(OwnerModulesDataService);
  private editingId: string | null = null;
  private currentPlans: string[] = ['All Plans'];
  isEditMode = false;

  readonly categoryOptions: ModuleCategory[] = ['Core Business', 'Core System', 'Advanced'];
  readonly statusOptions: ModuleStatus[] = ['Enabled', 'Disabled'];

  readonly featureOptions = computed(() => this.modulesData.features().filter((item) => item.active));
  featureSearch = '';
  filteredFeatureOptions() {
    const query = this.featureSearch.trim().toLowerCase();
    if (!query) {
      return this.featureOptions();
    }
    return this.featureOptions().filter((item) =>
      item.nameEn.toLowerCase().includes(query) ||
      item.nameAr.toLowerCase().includes(query) ||
      item.moduleCategory.toLowerCase().includes(query),
    );
  }

  readonly form = this.fb.group({
    nameAr: ['', Validators.required],
    nameEn: ['', Validators.required],
    category: this.fb.control<ModuleCategory>('Core Business', { validators: [Validators.required] }),
    description: ['', Validators.required],
    status: this.fb.control<ModuleStatus>('Enabled', { validators: [Validators.required] }),
    selectedFeatures: this.fb.array<string>([]),
  });

  get canSubmit(): boolean {
    const { nameAr, nameEn, category, description, status } = this.form.controls;
    const hasFeatures = this.selectedFeaturesArray.length > 0;
    return (
      nameAr.valid &&
      nameEn.valid &&
      category.valid &&
      description.valid &&
      status.valid &&
      hasFeatures
    );
  }

  private get selectedFeaturesArray(): FormArray {
    return this.form.controls.selectedFeatures;
  }

  isFeatureSelected(id: string): boolean {
    return this.selectedFeaturesArray.value.includes(id);
  }

  toggleFeature(id: string): void {
    const index = this.selectedFeaturesArray.value.indexOf(id);
    if (index === -1) {
      this.selectedFeaturesArray.push(this.fb.control(id));
    } else {
      this.selectedFeaturesArray.removeAt(index);
    }
  }

  async save(): Promise<void> {
    if (!this.canSubmit) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isEditMode && this.editingId) {
      await this.modulesData.updateModule({
        id: this.editingId,
        nameAr: this.form.controls.nameAr.value ?? '',
        nameEn: this.form.controls.nameEn.value ?? '',
        description: this.form.controls.description.value ?? '',
        category: this.form.controls.category.value ?? 'Core Business',
        status: this.form.controls.status.value ?? 'Enabled',
        includedInPlans: this.currentPlans,
        featureIds: this.selectedFeaturesArray.value as string[],
      });
    } else {
      await this.modulesData.createModule({
        nameAr: this.form.controls.nameAr.value ?? '',
        nameEn: this.form.controls.nameEn.value ?? '',
        description: this.form.controls.description.value ?? '',
        category: this.form.controls.category.value ?? 'Core Business',
        status: this.form.controls.status.value ?? 'Enabled',
        includedInPlans: ['All Plans'],
        featureIds: this.selectedFeaturesArray.value as string[],
      });
    }

    await this.router.navigate(['/owner/modules']);
  }

  constructor() {
    void this.loadFeatures();
    void this.loadForEditIfNeeded();
  }

  private async loadFeatures(): Promise<void> {
    try {
      await this.modulesData.refreshFeatures();
    } catch (error) {
      console.error('Failed to load module features.', error);
    }
  }

  private async loadForEditIfNeeded(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.isEditMode = true;
    this.editingId = id;

    const module = await this.modulesData.getModule(id);
    this.currentPlans = module.includedInPlans ?? ['All Plans'];

    this.form.patchValue({
      nameAr: module.nameAr ?? '',
      nameEn: module.name ?? '',
      category: module.category,
      description: module.description,
      status: module.status,
    });

    this.selectedFeaturesArray.clear();
    for (const featureId of module.featureIds ?? []) {
      this.selectedFeaturesArray.push(this.fb.control(featureId));
    }
  }
}
