import { Injectable, inject, signal } from '@angular/core';
import { TenantGroupDetailsDataService } from '../data-access/tenant-group-details-data.service';
import { GroupDetails, GroupStudent } from '../models/tenant-group-details.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupDetailsStore {
  private readonly data = inject(TenantGroupDetailsDataService);

  readonly group = signal<GroupDetails | null>(null);
  readonly selectedStudent = signal<GroupStudent | null>(null);
  readonly students = signal<GroupStudent[]>([...this.data.students]);

  loadGroup(id: string | null): void {
    this.group.set(this.data.getGroupById(id));
  }
}
