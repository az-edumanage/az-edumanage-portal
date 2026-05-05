import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { OwnerUsersListFacade } from '../../state/owner-users-list.facade';
import { OwnerTenantsDataService } from '../../data-access/owner-tenants-data.service';
import { OwnerUsersDataService } from '../../data-access/owner-users-data.service';
import { PlatformUser, UserStatus } from '../../models/owner-users.models';

@Component({
  selector: 'app-owner-web-users-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-web-users-list.component.html',
  styleUrl: './owner-web-users-list.component.css'
})
export class OwnerWebUsersListComponent implements OnInit {
  private readonly facade = inject(OwnerUsersListFacade);
  private readonly tenantsData = inject(OwnerTenantsDataService);
  private readonly usersData = inject(OwnerUsersDataService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly filter = this.facade.filter;
  readonly webUsers = computed(() =>
    this.facade.filteredUsers().filter((user) => user.portalType === 'web'),
  );
  readonly filteredUsers = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) {
      return this.webUsers();
    }
    return this.webUsers().filter((user) => this.matchesSearch(user, query));
  });
  readonly activeTab = signal<'current' | 'subscribers'>('current');
  readonly statusMenuUserId = signal<string | null>(null);
  readonly statusOptions: UserStatus[] = ['Active', 'Inactive', 'Suspended'];
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly totalItems = computed(() => this.filteredUsers().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.pageSize())));
  readonly currentPageDisplay = computed(() => Math.min(this.currentPage(), this.totalPages()));
  readonly pagedUsers = computed(() => {
    const page = this.currentPageDisplay();
    const start = (page - 1) * this.pageSize();
    return this.filteredUsers().slice(start, start + this.pageSize());
  });

  async ngOnInit(): Promise<void> {
    const searchFromQuery = (this.route.snapshot.queryParamMap.get('search') ?? '').trim();
    if (searchFromQuery) {
      this.searchTerm.set(searchFromQuery);
    }

    this.loading.set(true);
    this.loadError.set(null);
    try {
      await this.usersData.loadWebUsersFromBackend();
    } catch {
      this.loadError.set('Failed to load web users from backend.');
    } finally {
      this.loading.set(false);
    }
  }

  setFilter(value: 'All' | 'Super Admin' | 'Support Agent' | 'Billing Manager' | 'Developer'): void {
    this.facade.setFilter(value);
  }

  setTab(tab: 'current' | 'subscribers'): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  onPageSizeChange(value: number): void {
    this.pageSize.set(value);
    this.currentPage.set(1);
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((v) => v - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((v) => v + 1);
    }
  }

  tenantNameOf(user: PlatformUser): string {
    if (!user.tenantId) return 'Not assigned';
    const tenant = this.tenantsData.tenants().find((item) => item.id === user.tenantId);
    return tenant?.name ?? 'Unknown tenant';
  }

  toggleStatusMenu(userId: string): void {
    this.statusMenuUserId.update((current) => (current === userId ? null : userId));
  }

  closeStatusMenu(): void {
    this.statusMenuUserId.set(null);
  }

  setUserStatus(user: PlatformUser, status: UserStatus): void {
    this.usersData.updateUserStatus(user.id, status);
    this.closeStatusMenu();
  }

  assignToTenant(user: PlatformUser): void {
    void this.router.navigate(['/owner/tenants/create'], {
      queryParams: {
        contactName: user.fullName || '',
        contactEmail: user.email || '',
        source: 'web-users',
        returnSearch: this.searchTerm().trim(),
      },
    });
  }

  private matchesSearch(user: PlatformUser, query: string): boolean {
    const haystack = [
      user.id,
      user.fullName,
      user.email,
      user.username ?? '',
      user.phoneNumber ?? '',
      user.role,
      user.status,
      user.lastLogin,
      user.tenantId ?? '',
      this.tenantNameOf(user),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  }
}
