import { Injectable, inject, signal } from '@angular/core';
import { OwnerSettingsDataService } from '../data-access/owner-settings-data.service';
import {
  OwnerSettingsPaymentMethod,
  OwnerSettingsSubscriptionCycle,
  OwnerSettingsTabId,
  SubjectStructureNode,
  SubjectStructureNodeType,
} from '../models/owner-settings.models';

@Injectable({ providedIn: 'root' })
export class OwnerSettingsStore {
  private readonly data = inject(OwnerSettingsDataService);

  readonly activeTab = signal<OwnerSettingsTabId>('general');
  readonly tabs = this.data.tabs;

  readonly subscriptionCycles = signal<OwnerSettingsSubscriptionCycle[]>(this.data.getSubscriptionCycles());
  readonly paymentMethods = signal<OwnerSettingsPaymentMethod[]>(this.data.getPaymentMethods());
  readonly subjectStructure = signal<SubjectStructureNode[]>([]);
  private readonly subjectNodeIdCounter = signal(1);

  setActiveTab(tabId: OwnerSettingsTabId): void {
    this.activeTab.set(tabId);
  }

  addCycle(): void {
    this.subscriptionCycles.update((current) => {
      const newId = this.getNextId(current.map((cycle) => cycle.id));

      return [
        ...current,
        { id: newId, name: 'New Cycle', days: 30, icon: 'event', active: true },
      ];
    });
  }

  removeCycle(id: number): void {
    this.subscriptionCycles.update((current) => current.filter((cycle) => cycle.id !== id));
  }

  addPaymentMethod(): void {
    this.paymentMethods.update((current) => {
      const newId = this.getNextId(current.map((method) => method.id));

      return [
        ...current,
        {
          id: newId,
          name: 'New Method',
          description: 'Method description',
          icon: 'payment',
          active: true,
        },
      ];
    });
  }

  removePaymentMethod(id: number): void {
    this.paymentMethods.update((current) => current.filter((method) => method.id !== id));
  }

  savePresets(): void {
    this.data.savePresets(this.subscriptionCycles(), this.paymentMethods());
  }

  addSubjectRootField(nameEn: string, nameAr: string): void {
    const cleanedNameEn = nameEn.trim();
    const cleanedNameAr = nameAr.trim();
    if (!cleanedNameEn && !cleanedNameAr) {
      return;
    }

    const firstCard: SubjectStructureNode = {
      id: this.nextSubjectNodeId(),
      type: 'field',
      nameEn: cleanedNameEn || 'Untitled',
      nameAr: cleanedNameAr,
      children: [],
    };

    const node: SubjectStructureNode = {
      id: this.nextSubjectNodeId(),
      type: 'field',
      nameEn: cleanedNameEn || 'Untitled',
      nameAr: cleanedNameAr,
      children: [firstCard],
    };

    this.subjectStructure.update((current) => [...current, node]);
  }

  updateSubjectNodeNames(nodeId: number, nameEn: string, nameAr: string): void {
    const cleanedNameEn = nameEn.trim();
    const cleanedNameAr = nameAr.trim();
    this.subjectStructure.update((current) =>
      this.updateNodeNames(current, nodeId, cleanedNameEn || 'Untitled', cleanedNameAr),
    );
  }

  addSubjectChildNode(parentId: number, type: SubjectStructureNodeType): void {
    const defaultNameEn = type === 'sequence' ? 'Sequence' : '';
    const defaultNameAr = type === 'sequence' ? 'تسلسل' : '';
    const node: SubjectStructureNode = {
      id: this.nextSubjectNodeId(),
      type,
      nameEn: defaultNameEn,
      nameAr: defaultNameAr,
      children: [],
    };

    this.subjectStructure.update((current) => this.appendChildNode(current, parentId, node));
  }

  removeSubjectNode(nodeId: number): void {
    this.subjectStructure.update((current) => this.removeNode(current, nodeId));
  }

  private getNextId(ids: number[]): number {
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  private nextSubjectNodeId(): number {
    const next = this.subjectNodeIdCounter();
    this.subjectNodeIdCounter.set(next + 1);
    return next;
  }

  private updateNodeNames(
    nodes: SubjectStructureNode[],
    nodeId: number,
    nameEn: string,
    nameAr: string,
  ): SubjectStructureNode[] {
    return nodes.map((node) => {
      if (node.id === nodeId) {
        return { ...node, nameEn, nameAr };
      }

      return {
        ...node,
        children: this.updateNodeNames(node.children, nodeId, nameEn, nameAr),
      };
    });
  }

  private appendChildNode(
    nodes: SubjectStructureNode[],
    parentId: number,
    child: SubjectStructureNode,
  ): SubjectStructureNode[] {
    return nodes.map((node) => {
      if (node.id === parentId) {
        return { ...node, children: [...node.children, child] };
      }

      return {
        ...node,
        children: this.appendChildNode(node.children, parentId, child),
      };
    });
  }

  private removeNode(nodes: SubjectStructureNode[], nodeId: number): SubjectStructureNode[] {
    const filtered = nodes.filter((node) => node.id !== nodeId);

    return filtered.map((node) => ({
      ...node,
      children: this.removeNode(node.children, nodeId),
    }));
  }
}
