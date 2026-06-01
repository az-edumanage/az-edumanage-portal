import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ViewEncapsulation } from '@angular/core';
import { I18nService } from '../../../../core/services/i18n.service';
import { OwnerSettingsGeneralTabComponent } from '../../components/owner-settings-general-tab/owner-settings-general-tab.component';
import { OwnerSettingsSubjectTabComponent } from '../../components/owner-settings-subject-tab/owner-settings-subject-tab.component';
import { OwnerSettingsPresetsTabComponent } from '../../components/owner-settings-presets-tab/owner-settings-presets-tab.component';
import { OwnerSettingsCountryTabComponent } from '../../components/owner-settings-country-tab/owner-settings-country-tab.component';
import { OwnerSettingsSecurityTabComponent } from '../../components/owner-settings-security-tab/owner-settings-security-tab.component';
import { OwnerSettingsRolesTabComponent } from '../../components/owner-settings-roles-tab/owner-settings-roles-tab.component';
import { OwnerSettingsStatusTabComponent } from '../../components/owner-settings-status-tab/owner-settings-status-tab.component';
import { OwnerSettingsBillingTabComponent } from '../../components/owner-settings-billing-tab/owner-settings-billing-tab.component';
import { OwnerSettingsCommunicationTabComponent } from '../../components/owner-settings-communication-tab/owner-settings-communication-tab.component';
import { OwnerSettingsStorageTabComponent } from '../../components/owner-settings-storage-tab/owner-settings-storage-tab.component';
import { OwnerSettingsComplianceTabComponent } from '../../components/owner-settings-compliance-tab/owner-settings-compliance-tab.component';
import { OwnerSettingsModulesFeaturesTabComponent } from '../../components/owner-settings-modules-features-tab/owner-settings-modules-features-tab.component';
import { OwnerSettingsPresetsSaveStatus, OwnerSettingsTabId } from '../../models/owner-settings.models';
import { OwnerSettingsFacade } from '../../state/owner-settings.facade';

@Component({
  selector: 'app-owner-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule,
    OwnerSettingsGeneralTabComponent,
    OwnerSettingsSubjectTabComponent,
    OwnerSettingsPresetsTabComponent,
    OwnerSettingsCountryTabComponent,
    OwnerSettingsSecurityTabComponent,
    OwnerSettingsRolesTabComponent,
    OwnerSettingsStatusTabComponent,
    OwnerSettingsModulesFeaturesTabComponent,
    OwnerSettingsBillingTabComponent,
    OwnerSettingsCommunicationTabComponent,
    OwnerSettingsStorageTabComponent,
    OwnerSettingsComplianceTabComponent,
  ],
  templateUrl: './owner-settings.component.html',
  styleUrl: './owner-settings.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class OwnerSettingsComponent implements OnInit {
  private readonly facade = inject(OwnerSettingsFacade);
  private readonly i18nService = inject(I18nService);

  readonly activeTab = this.facade.activeTab;
  readonly subscriptionCycles = this.facade.subscriptionCycles;
  readonly paymentMethods = this.facade.paymentMethods;
  readonly tabs = this.facade.tabs;
  readonly subjectTemplates = this.facade.subjectTemplates;
  readonly isRtl = this.i18nService.isRtl;
  readonly isSubjectTemplateFormOpen = signal(false);
  readonly editingTemplateId = signal<number | null>(null);
  readonly newTemplateName = signal('');
  readonly newTemplateLevels = signal<string[]>(['']);
  readonly newTemplateIsDefault = signal(false);
  readonly canSaveNewTemplate = computed(() => {
    const nameValid = this.newTemplateName().trim().length > 0;
    const hasValidLevel = this.newTemplateLevels().some((level) => level.trim().length > 0);
    return nameValid && hasValidLevel;
  });
  readonly isSavingPresets = signal(false);
  readonly presetsSaveStatus = signal<OwnerSettingsPresetsSaveStatus | null>(null);

  readonly t = (key: string): string => this.i18nService.t(key);

  ngOnInit(): void {
    void this.facade.initializePresets();
  }

  setActiveTab(tabId: OwnerSettingsTabId): void {
    this.facade.setActiveTab(tabId);
  }

  addCycle() {
    this.facade.addCycle();
  }

  removeCycle(id: number) {
    this.facade.removeCycle(id);
  }

  addPaymentMethod() {
    this.facade.addPaymentMethod();
  }

  removePaymentMethod(id: number) {
    this.facade.removePaymentMethod(id);
  }

  async savePresets(): Promise<void> {
    if (this.isSavingPresets()) {
      return;
    }

    this.isSavingPresets.set(true);
    try {
      await this.facade.savePresets();
      this.presetsSaveStatus.set({
        type: 'success',
        title: 'Saved Successfully',
        message: 'Subscription cycles were saved to backend successfully.',
      });
    } catch (error) {
      this.presetsSaveStatus.set({
        type: 'error',
        title: 'Save Failed',
        message: this.resolveRootCauseMessage(error),
      });
    } finally {
      this.isSavingPresets.set(false);
    }
  }

  closePresetsSaveStatus(): void {
    this.presetsSaveStatus.set(null);
  }

  openSubjectTemplateForm(): void {
    this.editingTemplateId.set(null);
    this.isSubjectTemplateFormOpen.set(true);
  }

  closeSubjectTemplateForm(): void {
    this.isSubjectTemplateFormOpen.set(false);
    this.editingTemplateId.set(null);
    this.newTemplateName.set('');
    this.newTemplateLevels.set(['']);
    this.newTemplateIsDefault.set(false);
  }

  addTemplateLevel(): void {
    this.newTemplateLevels.update((levels) => [...levels, '']);
  }

  updateTemplateLevel(index: number, value: string): void {
    this.newTemplateLevels.update((levels) =>
      levels.map((level, levelIndex) => (levelIndex === index ? value : level)),
    );
  }

  removeTemplateLevel(index: number): void {
    this.newTemplateLevels.update((levels) => {
      if (levels.length <= 1) {
        return [''];
      }
      return levels.filter((_, levelIndex) => levelIndex !== index);
    });
  }

  saveSubjectTemplate(): void {
    if (!this.canSaveNewTemplate()) {
      return;
    }

    const payload = {
      name: this.newTemplateName(),
      levels: this.newTemplateLevels(),
      isDefault: this.newTemplateIsDefault(),
    };
    const editingId = this.editingTemplateId();
    if (editingId === null) {
      this.facade.createSubjectTemplate(payload);
    } else {
      this.facade.updateSubjectTemplate(editingId, payload);
    }
    this.closeSubjectTemplateForm();
  }

  editSubjectTemplate(templateId: number): void {
    const template = this.subjectTemplates().find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    this.editingTemplateId.set(templateId);
    this.newTemplateName.set(template.name);
    this.newTemplateLevels.set(template.levels.length > 0 ? [...template.levels] : ['']);
    this.newTemplateIsDefault.set(template.isDefault);
    this.isSubjectTemplateFormOpen.set(true);
  }

  deleteSubjectTemplate(templateId: number): void {
    this.facade.deleteSubjectTemplate(templateId);
  }

  setDefaultSubjectTemplate(templateId: number): void {
    this.facade.setDefaultSubjectTemplate(templateId);
  }

  private resolveRootCauseMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const payload = error.error as { message?: string; details?: unknown } | null;
      const details = Array.isArray(payload?.details)
        ? payload?.details.filter((item) => typeof item === 'string').join(' | ')
        : '';
      const message = payload?.message?.trim() || error.message?.trim() || `HTTP ${error.status}`;
      return details ? `${message} (${details})` : message;
    }

    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }

    return 'Unexpected server error while saving subscription cycles.';
  }
}
