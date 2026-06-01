import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TenantCountry, TenantCountrySettingsService } from '../../data-access/tenant-country-settings.service';

@Component({
  selector: 'app-tenant-platform-settings',
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-platform-settings.component.html',
})
export class TenantPlatformSettingsComponent implements OnInit {
  private readonly tenantCountrySettings = inject(TenantCountrySettingsService);

  readonly searchQuery = signal('');
  readonly activeTab = signal('users');
  readonly userSearchQuery = signal('');
  readonly userRoleFilter = signal('');
  readonly countrySearchQuery = signal('');
  readonly countryFilter = signal('');
  readonly showCountryModal = signal(false);
  readonly newCountryName = signal('');
  readonly countryLoadError = signal<string | null>(null);
  readonly countrySaveError = signal<string | null>(null);
  readonly countryNameError = signal<string | null>(null);
  readonly countriesLoading = signal(false);
  readonly countriesLoaded = signal(false);
  readonly countrySaving = signal(false);
  readonly countryDeletingId = signal<string | null>(null);
  readonly editingCountry = signal<TenantCountry | null>(null);

  readonly settingsTabs = [
    {
      id: 'users',
      title: 'Users',
      description: 'User access, roles, and invitations.',
      icon: 'groups',
    },
    {
      id: 'country',
      title: 'Country',
      description: 'Countries available for tenant setup.',
      icon: 'public',
    },
    {
      id: 'general',
      title: 'General',
      description: 'Center identity, default language, and timezone.',
      icon: 'tune',
    },
    {
      id: 'access',
      title: 'Access',
      description: 'Tenant workspace access and operational preferences.',
      icon: 'admin_panel_settings',
    },
    {
      id: 'academic',
      title: 'Academic Defaults',
      description: 'Defaults used across tenant academic workflows.',
      icon: 'school',
    },
  ];

  readonly users = [
    { name: 'Tenant Admin', email: 'admin@center.com', role: 'Admin', status: 'Active' },
    { name: 'Academic Manager', email: 'academic@center.com', role: 'Manager', status: 'Active' },
    { name: 'Front Desk', email: 'frontdesk@center.com', role: 'Staff', status: 'Pending' },
  ];

  readonly countries = signal<TenantCountry[]>([]);

  readonly filteredUsers = computed(() => {
    const query = this.userSearchQuery().trim().toLowerCase();
    const role = this.userRoleFilter();

    return this.users.filter((user) => {
      const matchesQuery = !query
        || user.name.toLowerCase().includes(query)
        || user.email.toLowerCase().includes(query);
      const matchesRole = !role || user.role === role;

      return matchesQuery && matchesRole;
    });
  });

  readonly filteredCountries = computed(() => {
    const query = this.countrySearchQuery().trim().toLowerCase();
    const filter = this.countryFilter();

    return this.countries()
      .filter((country) => !query || country.name.toLowerCase().includes(query))
      .filter((country) => !filter || country.name.charAt(0).toUpperCase() === filter);
  });

  ngOnInit(): void {
    void this.loadCountries();
  }

  async selectTab(tabId: string): Promise<void> {
    this.activeTab.set(tabId);
    if (tabId === 'country' && !this.countriesLoaded()) {
      await this.loadCountries();
    }
  }

  async loadCountries(): Promise<void> {
    if (this.countriesLoading()) {
      return;
    }
    this.countriesLoading.set(true);
    this.countryLoadError.set(null);
    try {
      this.countries.set(await this.tenantCountrySettings.listCountries());
      this.countriesLoaded.set(true);
    } catch {
      this.countryLoadError.set('Unable to load countries. Please try again.');
    } finally {
      this.countriesLoading.set(false);
    }
  }

  openCountryModal(): void {
    this.editingCountry.set(null);
    this.newCountryName.set('');
    this.countryNameError.set(null);
    this.countrySaveError.set(null);
    this.showCountryModal.set(true);
  }

  openEditCountryModal(country: TenantCountry): void {
    this.editingCountry.set(country);
    this.newCountryName.set(country.name);
    this.countryNameError.set(null);
    this.countrySaveError.set(null);
    this.showCountryModal.set(true);
  }

  closeCountryModal(): void {
    if (this.countrySaving()) {
      return;
    }
    this.showCountryModal.set(false);
    this.editingCountry.set(null);
    this.newCountryName.set('');
    this.countryNameError.set(null);
    this.countrySaveError.set(null);
  }

  async saveCountry(): Promise<void> {
    if (this.countrySaving()) {
      return;
    }
    const name = this.newCountryName().trim();
    this.countryNameError.set(null);
    this.countrySaveError.set(null);

    if (!name) {
      this.countryNameError.set('Country name is required.');
      return;
    }

    this.countrySaving.set(true);
    try {
      const editing = this.editingCountry();
      const saved = editing
        ? await this.tenantCountrySettings.updateCountry(editing.id, name)
        : await this.tenantCountrySettings.createCountry(name);
      this.countries.update((countries) => {
        const next = editing
          ? countries.map((country) => country.id === saved.id ? saved : country)
          : [...countries, saved];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });
      this.showCountryModal.set(false);
      this.editingCountry.set(null);
      this.newCountryName.set('');
      this.countriesLoaded.set(true);
    } catch (error) {
      this.countrySaveError.set(this.tenantCountrySettings.toUserMessage(error));
    } finally {
      this.countrySaving.set(false);
    }
  }

  async deleteCountry(country: TenantCountry): Promise<void> {
    if (this.countryDeletingId()) {
      return;
    }
    this.countryDeletingId.set(country.id);
    this.countryLoadError.set(null);
    try {
      await this.tenantCountrySettings.deleteCountry(country.id);
      this.countries.update((countries) => countries.filter((item) => item.id !== country.id));
    } catch {
      this.countryLoadError.set('Unable to delete country. Please try again.');
    } finally {
      this.countryDeletingId.set(null);
    }
  }
}
