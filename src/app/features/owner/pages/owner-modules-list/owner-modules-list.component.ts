import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ModuleCategory, OwnerModule } from '../../models/owner-modules.models';
import { OwnerModulesListFacade } from '../../state/owner-modules-list.facade';
import { OwnerModulesDataService } from '../../data-access/owner-modules-data.service';

@Component({
  selector: 'app-owner-modules-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './owner-modules-list.component.html',
  styleUrl: './owner-modules-list.component.css'
})
export class OwnerModulesListComponent {
  private readonly protectedModuleCodes = new Set([
    'students-management',
    'exams-and-quiz',
    'parent-portal',
    'lms',
    'questions-bank',
    'students-community',
    'book-store',
    'advanced-analytics',
    'competitions',
    'live-sessions',
    'social-media',
    'market-place',
  ]);
  private readonly protectedModuleNames = new Set([
    'students management',
    'exams and quiz',
    'parent portal',
    'lms',
    'questions bank',
    'students community',
    'book store',
    'advanced analytics',
    'competitions',
    'live sessions',
    'social media',
    'market place',
  ]);

  private readonly facade = inject(OwnerModulesListFacade);
  private readonly data = inject(OwnerModulesDataService);
  private readonly router = inject(Router);

  readonly filter = this.facade.filter;
  readonly filteredModules = this.facade.filteredModules;
  pendingDeleteModule: OwnerModule | null = null;
  deleting = false;
  actionStatus: { success: boolean; message: string } | null = null;

  setFilter(value: 'All' | ModuleCategory): void {
    this.facade.setFilter(value);
  }

  openEdit(module: OwnerModule): void {
    void this.router.navigate(['/owner/modules', module.id, 'edit']);
  }

  openDeleteConfirm(module: OwnerModule): void {
    if (this.isProtectedModule(module)) {
      this.actionStatus = {
        success: false,
        message: 'Protected system modules cannot be deleted.',
      };
      return;
    }
    this.pendingDeleteModule = module;
  }

  isProtectedModule(module: OwnerModule): boolean {
    return this.protectedModuleCodes.has(module.code.toLowerCase()) ||
      this.protectedModuleNames.has(module.name.toLowerCase());
  }

  closeDeleteConfirm(): void {
    if (this.deleting) return;
    this.pendingDeleteModule = null;
  }

  closeActionStatus(): void {
    this.actionStatus = null;
  }

  async confirmDelete(): Promise<void> {
    if (!this.pendingDeleteModule || this.deleting) return;
    try {
      this.deleting = true;
      await this.data.deleteModule(this.pendingDeleteModule.id);
      this.pendingDeleteModule = null;
      this.actionStatus = { success: true, message: 'Module deleted successfully.' };
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      this.actionStatus = { success: false, message: errorMessage };
    } finally {
      this.deleting = false;
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error?: unknown }).error === 'object' &&
      (error as { error: { message?: unknown } }).error?.message &&
      typeof (error as { error: { message: unknown } }).error.message === 'string'
    ) {
      return (error as { error: { message: string } }).error.message;
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'Failed to delete module.';
  }
}
