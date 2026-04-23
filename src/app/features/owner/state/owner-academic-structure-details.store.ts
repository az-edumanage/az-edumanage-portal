import { Injectable, inject, signal } from '@angular/core';
import { OwnerAcademicStructureDetailsDataService } from '../data-access/owner-academic-structure-details-data.service';
import { AcademicStructureFeature, AcademicStructureLimit } from '../models/owner-academic-structure-details.models';

@Injectable({ providedIn: 'root' })
export class OwnerAcademicStructureDetailsStore {
  private readonly data = inject(OwnerAcademicStructureDetailsDataService);

  readonly activeTab = signal<string>('overview');

  readonly tabs = this.data.tabs;
  readonly features = signal<AcademicStructureFeature[]>([...this.data.features]);
  readonly limits = signal<AcademicStructureLimit[]>([...this.data.limits]);

  readonly availablePlans = this.data.availablePlans;
  readonly overrides = this.data.overrides;
  readonly changeLogs = this.data.changeLogs;
}
