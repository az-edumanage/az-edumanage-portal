import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../../../core/services/i18n.service';
import { OwnerSettingsTabId } from '../../models/owner-settings.models';
import { OwnerSettingsFacade } from '../../state/owner-settings.facade';

@Component({
  selector: 'app-owner-settings',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './owner-settings.component.html',
  styleUrl: './owner-settings.component.css'})
export class OwnerSettingsComponent {
  private readonly facade = inject(OwnerSettingsFacade);
  private readonly i18nService = inject(I18nService);
  private readonly subjectConnectorColors = ['#5b21ff', '#0f766e', '#2563eb', '#be185d', '#b45309'];

  readonly activeTab = this.facade.activeTab;
  readonly subscriptionCycles = this.facade.subscriptionCycles;
  readonly paymentMethods = this.facade.paymentMethods;
  readonly tabs = this.facade.tabs;
  readonly language = this.i18nService.language;
  readonly subjectStructure = this.facade.subjectStructure;
  readonly newSubjectRootNameEn = signal('');
  readonly newSubjectRootNameAr = signal('');
  readonly collapsedSubjectNodeIds = signal<Set<number>>(new Set<number>());
  readonly editableCardIds = signal<Set<number>>(new Set<number>());

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

  savePresets() {
    this.facade.savePresets();
  }

  addSubjectRootField(): void {
    const beforeRootIds = new Set(this.subjectStructure().map((node) => node.id));
    this.facade.addSubjectRootField(this.newSubjectRootNameEn(), this.newSubjectRootNameAr());
    this.newSubjectRootNameEn.set('');
    this.newSubjectRootNameAr.set('');

    const newRoot = this.subjectStructure().find((node) => !beforeRootIds.has(node.id));
    if (!newRoot) {
      return;
    }

    this.collapsedSubjectNodeIds.update((current) => {
      const next = new Set(current);
      next.delete(newRoot.id);
      return next;
    });

    const firstCard = newRoot.children[0];
    if (firstCard) {
      this.editableCardIds.update((current) => {
        const next = new Set(current);
        next.add(firstCard.id);
        return next;
      });
    }
  }

  updateSubjectNodeNames(nodeId: number, nameEn: string, nameAr: string): void {
    this.facade.updateSubjectNodeNames(nodeId, nameEn, nameAr);
  }

  addSubjectChildField(parentId: number): void {
    this.facade.addSubjectChildNode(parentId, 'field');
    const parent = this.subjectStructure().find((node) => node.id === parentId);
    const newCard = parent?.children[parent.children.length - 1];
    if (newCard) {
      this.editableCardIds.update((current) => {
        const next = new Set(current);
        next.add(newCard.id);
        return next;
      });
    }
    this.collapsedSubjectNodeIds.update((current) => {
      const next = new Set(current);
      next.delete(parentId);
      return next;
    });
  }

  addSubjectSequence(parentId: number): void {
    this.facade.addSubjectChildNode(parentId, 'sequence');
    this.collapsedSubjectNodeIds.update((current) => {
      const next = new Set(current);
      next.delete(parentId);
      return next;
    });
  }

  removeSubjectNode(nodeId: number): void {
    this.facade.removeSubjectNode(nodeId);
    this.collapsedSubjectNodeIds.update((current) => {
      const next = new Set(current);
      next.delete(nodeId);
      return next;
    });
    this.editableCardIds.update((current) => {
      const next = new Set(current);
      next.delete(nodeId);
      return next;
    });
  }

  toggleSubjectNodeCollapse(nodeId: number): void {
    this.collapsedSubjectNodeIds.update((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }

  isSubjectNodeCollapsed(nodeId: number): boolean {
    return this.collapsedSubjectNodeIds().has(nodeId);
  }

  getSubjectConnectorColor(index: number): string {
    return this.subjectConnectorColors[index % this.subjectConnectorColors.length];
  }

  isCardInEditMode(cardId: number): boolean {
    return this.editableCardIds().has(cardId);
  }

  editCard(cardId: number): void {
    this.editableCardIds.update((current) => {
      const next = new Set(current);
      next.add(cardId);
      return next;
    });
  }

  submitCard(rootId: number, cardId: number, nameEn: string, nameAr: string): void {
    this.facade.updateSubjectNodeNames(cardId, nameEn, nameAr);
    this.editableCardIds.update((current) => {
      const next = new Set(current);
      next.delete(cardId);
      return next;
    });

    this.facade.addSubjectChildNode(rootId, 'field');
    const root = this.subjectStructure().find((node) => node.id === rootId);
    const newCard = root?.children[root.children.length - 1];
    if (newCard) {
      this.editableCardIds.update((current) => {
        const next = new Set(current);
        next.add(newCard.id);
        return next;
      });
    }
  }
}
