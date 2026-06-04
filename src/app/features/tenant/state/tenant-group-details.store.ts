import { computed, Injectable, inject, signal } from '@angular/core';
import { take } from 'rxjs';
import { TenantGroupDetailsDataService } from '../data-access/tenant-group-details-data.service';
import { GroupDetails, GroupStudent } from '../models/tenant-group-details.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupDetailsStore {
  private readonly data = inject(TenantGroupDetailsDataService);

  readonly group = signal<GroupDetails | null>(null);
  readonly selectedStudent = signal<GroupStudent | null>(null);
  readonly students = signal<GroupStudent[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly avgAttendanceLabel = computed(() => this.formatRate(this.group()?.avgAttendanceRate));
  readonly absenceRateLabel = computed(() => this.formatRate(this.group()?.absenceRate));
  readonly monthlyRevenueLabel = computed(() => {
    const group = this.group();
    const amount = group?.monthlyRevenue ?? 0;
    const currency = group?.currency ?? 'EGP';
    return `${amount} ${currency}`;
  });
  readonly capacityUsageLabel = computed(() => {
    const group = this.group();
    if (!group?.capacity) {
      return '0%';
    }
    return `${Math.round((group.enrolled / group.capacity) * 100)}%`;
  });

  loadGroup(id: string | null): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.group.set(null);
    this.students.set([]);
    this.selectedStudent.set(null);
    this.data.loadGroupById(id).pipe(take(1)).subscribe({
      next: (group) => {
        this.group.set(group);
        this.students.set(group.students ?? []);
        this.isLoading.set(false);
      },
      error: (error: Error) => {
        this.students.set([]);
        this.selectedStudent.set(null);
        this.error.set(error.message);
        this.isLoading.set(false);
      },
    });
  }

  private formatRate(value: number | null | undefined): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return '0%';
    }
    return `${value}%`;
  }
}
