import { Injectable, computed, signal } from '@angular/core';
import { TenantStatusItem } from '../models/owner-status.models';

const STORAGE_KEY = 'owner.subscription-order-statuses.v1';

@Injectable({ providedIn: 'root' })
export class OwnerSubscriptionOrderStatusesDataService {
  private readonly statusesState = signal<TenantStatusItem[]>(this.loadSeed());

  readonly statuses = computed(() => this.statusesState());
  readonly statusNames = computed(() => this.statusesState().map((item) => item.nameEn));

  upsertStatus(payload: { id?: string; nameEn: string; nameAr: string; color: string }): void {
    if (payload.id) {
      this.statusesState.update((current) => {
        const updated = current.map((item) =>
          item.id === payload.id
            ? { ...item, nameEn: payload.nameEn.trim(), nameAr: payload.nameAr.trim(), color: payload.color }
            : item,
        );
        this.persist(updated);
        return updated;
      });
      return;
    }

    const next: TenantStatusItem = {
      id: `subscription_order_status_${crypto.randomUUID().slice(0, 8)}`,
      nameEn: payload.nameEn.trim(),
      nameAr: payload.nameAr.trim(),
      color: payload.color,
    };

    this.statusesState.update((current) => {
      const exists = current.some((item) => item.nameEn.toLowerCase() === next.nameEn.toLowerCase());
      if (exists) return current;
      const updated = [...current, next];
      this.persist(updated);
      return updated;
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
      { id: 'so_pending', nameEn: 'Pending', nameAr: 'قيد الانتظار', color: '#d97706' },
      { id: 'so_approved', nameEn: 'Approved', nameAr: 'مقبول', color: '#16a34a' },
      { id: 'so_paid', nameEn: 'Paid', nameAr: 'مدفوع', color: '#2563eb' },
      { id: 'so_rejected', nameEn: 'Rejected', nameAr: 'مرفوض', color: '#dc2626' },
    ];

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seeded;
      const parsed = JSON.parse(raw) as TenantStatusItem[];
      if (!Array.isArray(parsed) || parsed.length === 0) return seeded;
      return parsed;
    } catch {
      return seeded;
    }
  }

  private persist(statuses: TenantStatusItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
    } catch {}
  }
}
