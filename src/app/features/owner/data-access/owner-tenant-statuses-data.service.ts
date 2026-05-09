import { Injectable, computed, signal } from '@angular/core';
import { TenantStatusItem } from '../models/owner-status.models';

const STORAGE_KEY = 'owner.tenant-statuses.v1';

@Injectable({ providedIn: 'root' })
export class OwnerTenantStatusesDataService {
  private readonly statusesState = signal<TenantStatusItem[]>(this.loadSeed());

  readonly statuses = computed(() => this.statusesState());
  readonly statusNames = computed(() => this.statusesState().map((item) => item.nameEn));

  addStatus(payload: Omit<TenantStatusItem, 'id'>): void {
    const next: TenantStatusItem = {
      id: `tenant_status_${crypto.randomUUID().slice(0, 8)}`,
      nameEn: payload.nameEn.trim(),
      nameAr: payload.nameAr.trim(),
      color: payload.color,
    };

    this.statusesState.update((current) => {
      const exists = current.some(
        (item) => item.nameEn.toLowerCase() === next.nameEn.toLowerCase(),
      );
      if (exists) {
        return current;
      }

      const updated = [...current, next];
      this.persist(updated);
      return updated;
    });
  }

  upsertStatus(payload: {
    id?: string;
    nameEn: string;
    nameAr: string;
    color: string;
  }): void {
    if (payload.id) {
      this.statusesState.update((current) => {
        const updated = current.map((item) =>
          item.id === payload.id
            ? {
                ...item,
                nameEn: payload.nameEn.trim(),
                nameAr: payload.nameAr.trim(),
                color: payload.color,
              }
            : item,
        );
        this.persist(updated);
        return updated;
      });
      return;
    }

    this.addStatus({
      nameEn: payload.nameEn,
      nameAr: payload.nameAr,
      color: payload.color,
    });
  }

  deleteStatus(id: string): void {
    this.statusesState.update((current) => {
      const updated = current.filter((item) => item.id !== id);
      this.persist(updated);
      return updated;
    });
  }

  findByName(name: string): TenantStatusItem | null {
    return this.statusesState().find((item) => item.nameEn === name) ?? null;
  }

  private loadSeed(): TenantStatusItem[] {
    const seeded: TenantStatusItem[] = [
      { id: 'st_active', nameEn: 'Active', nameAr: 'نشط', color: '#16a34a' },
      { id: 'st_trial', nameEn: 'Trial', nameAr: 'تجريبي', color: '#d97706' },
      { id: 'st_past_due', nameEn: 'Past Due', nameAr: 'متأخر', color: '#ea580c' },
      { id: 'st_suspended', nameEn: 'Suspended', nameAr: 'موقوف', color: '#dc2626' },
      { id: 'st_cancelled', nameEn: 'Cancelled', nameAr: 'ملغي', color: '#64748b' },
    ];

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return seeded;
      }

      const parsed = JSON.parse(raw) as TenantStatusItem[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return seeded;
      }

      return parsed;
    } catch {
      return seeded;
    }
  }

  private persist(statuses: TenantStatusItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
    } catch {
      // ignore persistence errors in local mode
    }
  }
}
