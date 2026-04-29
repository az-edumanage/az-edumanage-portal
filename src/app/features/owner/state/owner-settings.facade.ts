import { Injectable, inject } from '@angular/core';
import { OwnerSettingsTabId } from '../models/owner-settings.models';
import { OwnerSettingsStore } from './owner-settings.store';

@Injectable({ providedIn: 'root' })
export class OwnerSettingsFacade {
  private readonly store = inject(OwnerSettingsStore);

  readonly activeTab = this.store.activeTab;
  readonly tabs = this.store.tabs;
  readonly subscriptionCycles = this.store.subscriptionCycles;
  readonly paymentMethods = this.store.paymentMethods;
  readonly subjectStructure = this.store.subjectStructure;

  setActiveTab(tabId: OwnerSettingsTabId): void {
    this.store.setActiveTab(tabId);
  }

  addCycle(): void {
    this.store.addCycle();
  }

  removeCycle(id: number): void {
    this.store.removeCycle(id);
  }

  addPaymentMethod(): void {
    this.store.addPaymentMethod();
  }

  removePaymentMethod(id: number): void {
    this.store.removePaymentMethod(id);
  }

  savePresets(): void {
    this.store.savePresets();
  }

  addSubjectRootField(nameEn: string, nameAr: string): void {
    this.store.addSubjectRootField(nameEn, nameAr);
  }

  updateSubjectNodeNames(nodeId: number, nameEn: string, nameAr: string): void {
    this.store.updateSubjectNodeNames(nodeId, nameEn, nameAr);
  }

  addSubjectChildNode(parentId: number, type: 'field' | 'sequence'): void {
    this.store.addSubjectChildNode(parentId, type);
  }

  removeSubjectNode(nodeId: number): void {
    this.store.removeSubjectNode(nodeId);
  }
}
