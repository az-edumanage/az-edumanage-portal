import { Injectable, inject, signal } from '@angular/core';
import { OwnerSettingsDataService } from '../data-access/owner-settings-data.service';
import {
  OwnerSettingsPaymentMethod,
  OwnerSettingsSubscriptionCycle,
  OwnerSettingsTabId,
  SubjectTemplateCreateInput,
  SubjectTemplate,
  SubjectStructureNode,
  SubjectStructureNodeType,
} from '../models/owner-settings.models';

@Injectable({ providedIn: 'root' })
export class OwnerSettingsStore {
  private readonly data = inject(OwnerSettingsDataService);

  readonly activeTab = signal<OwnerSettingsTabId>('general');
  readonly tabs = this.data.tabs;

  readonly subscriptionCycles = signal<OwnerSettingsSubscriptionCycle[]>([]);
  readonly paymentMethods = signal<OwnerSettingsPaymentMethod[]>(this.data.getPaymentMethods());
  readonly subjectTemplates = signal<SubjectTemplate[]>([
    {
      id: 1,
      name: 'Standard Academic Structure',
      levels: ['Unit', 'Chapter', 'Lesson'],
      createdAt: 'CREATED 4/30/26',
      isDefault: true,
    },
    {
      id: 2,
      name: 'Concise Structure',
      levels: ['Part', 'Topic'],
      createdAt: 'CREATED 4/30/26',
      isDefault: false,
    },
  ]);
  readonly subjectStructure = signal<SubjectStructureNode[]>([]);
  private readonly subjectNodeIdCounter = signal(1);

  setActiveTab(tabId: OwnerSettingsTabId): void {
    this.activeTab.set(tabId);
  }

  async initializePresets(): Promise<void> {
    try {
      const cycles = await this.data.fetchSubscriptionCycles();
      this.subscriptionCycles.set(cycles);
    } catch {
      this.subscriptionCycles.set(this.data.getSubscriptionCycles());
    }
  }

  addCycle(): void {
    this.subscriptionCycles.update((current) => {
      const newId = this.getNextTemporaryCycleId(current.map((cycle) => cycle.id));

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

  async savePresets(): Promise<void> {
    const savedCycles = await this.data.saveSubscriptionCycles(this.subscriptionCycles());
    this.subscriptionCycles.set(savedCycles);
    this.data.savePresets(this.subscriptionCycles(), this.paymentMethods());
  }

  createSubjectTemplate(input: SubjectTemplateCreateInput): void {
    const current = this.subjectTemplates();
    const cleanedName = input.name.trim();
    const cleanedLevels = input.levels.map((level) => level.trim()).filter((level) => level.length > 0);
    if (!cleanedName || cleanedLevels.length === 0) {
      return;
    }

    const newId = this.getNextId(current.map((template) => template.id));
    const now = new Date();
    const createdAt = `CREATED ${now.getMonth() + 1}/${now.getDate()}/${String(now.getFullYear()).slice(-2)}`;
    const nextTemplate: SubjectTemplate = {
      id: newId,
      name: cleanedName,
      levels: cleanedLevels,
      createdAt,
      isDefault: input.isDefault,
    };

    this.subjectTemplates.set(
      input.isDefault
        ? [...current.map((template) => ({ ...template, isDefault: false })), nextTemplate]
        : [...current, nextTemplate],
    );
  }

  updateSubjectTemplate(id: number, input: SubjectTemplateCreateInput): void {
    const cleanedName = input.name.trim();
    const cleanedLevels = input.levels.map((level) => level.trim()).filter((level) => level.length > 0);
    if (!cleanedName || cleanedLevels.length === 0) {
      return;
    }

    this.subjectTemplates.update((current) =>
      current.map((template) =>
        template.id === id
          ? {
              ...template,
              name: cleanedName,
              levels: cleanedLevels,
              isDefault: input.isDefault,
            }
          : {
              ...template,
              isDefault: input.isDefault ? false : template.isDefault,
            },
      ),
    );
  }

  editSubjectTemplate(id: number): void {
    this.subjectTemplates.update((current) =>
      current.map((template) =>
        template.id === id
          ? { ...template, name: template.name.endsWith(' (Edited)') ? template.name : `${template.name} (Edited)` }
          : template,
      ),
    );
  }

  deleteSubjectTemplate(id: number): void {
    const nextTemplates = this.subjectTemplates().filter((template) => template.id !== id);
    if (nextTemplates.length === 0) {
      this.subjectTemplates.set([]);
      return;
    }

    const hasDefault = nextTemplates.some((template) => template.isDefault);
    this.subjectTemplates.set(
      hasDefault
        ? nextTemplates
        : nextTemplates.map((template, index) => ({ ...template, isDefault: index === 0 })),
    );
  }

  setDefaultSubjectTemplate(id: number): void {
    this.subjectTemplates.update((current) =>
      current.map((template) => ({ ...template, isDefault: template.id === id })),
    );
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

  private getNextTemporaryCycleId(ids: number[]): number {
    const temporaryIds = ids.filter((id) => id < 0);
    return temporaryIds.length > 0 ? Math.min(...temporaryIds) - 1 : -1;
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
