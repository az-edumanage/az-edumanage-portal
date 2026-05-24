import { Injectable, computed, signal } from '@angular/core';
import { TenantStatusItem } from '../models/owner-status.models';

const STORAGE_KEY = 'owner.tenant-statuses.v1';
const DEFAULT_STATUSES: TenantStatusItem[] = [
  { id: 'st_pending', nameEn: 'Pending', nameAr: 'قيد الانتظار', color: '#d97706' },
  { id: 'st_active', nameEn: 'Active', nameAr: 'نشط', color: '#16a34a' },
  { id: 'st_suspended', nameEn: 'Suspended', nameAr: 'موقوف', color: '#dc2626' },
  { id: 'st_disabled', nameEn: 'Disabled', nameAr: 'معطل', color: '#7c3aed' },
  { id: 'st_blocked', nameEn: 'Blocked', nameAr: 'محظور', color: '#b91c1c' },
  { id: 'st_unknown', nameEn: 'Unknown', nameAr: 'غير معروف', color: '#64748b' },
];

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
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return DEFAULT_STATUSES;
      }

      const parsed = JSON.parse(raw) as TenantStatusItem[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return DEFAULT_STATUSES;
      }

      return this.withDefaults(parsed);
    } catch {
      return DEFAULT_STATUSES;
    }
  }

  private withDefaults(parsed: TenantStatusItem[]): TenantStatusItem[] {
    const byName = new Map(parsed.map((item) => [item.nameEn.toLowerCase(), item]));
    for (const item of DEFAULT_STATUSES) {
      if (!byName.has(item.nameEn.toLowerCase())) {
        byName.set(item.nameEn.toLowerCase(), item);
      }
    }
    return DEFAULT_STATUSES.map((item) => byName.get(item.nameEn.toLowerCase()) ?? item);
  }

  private persist(statuses: TenantStatusItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
    } catch {
      // ignore persistence errors in local mode
    }
  }
}
