import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TenantCountry, TenantCountrySettingsService } from '../../data-access/tenant-country-settings.service';
import { TenantEquipmentFacility, TenantEquipmentFacilitySettingsService } from '../../data-access/tenant-equipment-facility-settings.service';
import { TenantRoomType, TenantRoomTypeSettingsService } from '../../data-access/tenant-room-type-settings.service';

@Component({
  selector: 'app-tenant-platform-settings',
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-platform-settings.component.html',
})
export class TenantPlatformSettingsComponent implements OnInit {
  private readonly tenantCountrySettings = inject(TenantCountrySettingsService);
  private readonly tenantRoomTypeSettings = inject(TenantRoomTypeSettingsService);
  private readonly tenantEquipmentFacilitySettings = inject(TenantEquipmentFacilitySettingsService);

  readonly searchQuery = signal('');
  readonly activeTab = signal('general');
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
  readonly roomTypes = signal<TenantRoomType[]>([]);
  readonly roomTypeSearchQuery = signal('');
  readonly roomTypeFilter = signal('');
  readonly roomTypesLoading = signal(false);
  readonly roomTypesLoaded = signal(false);
  readonly roomTypeLoadError = signal<string | null>(null);
  readonly showRoomTypeModal = signal(false);
  readonly editingRoomType = signal<TenantRoomType | null>(null);
  readonly roomTypeName = signal('');
  readonly roomTypeDescription = signal('');
  readonly roomTypeNameError = signal<string | null>(null);
  readonly roomTypeSaveError = signal<string | null>(null);
  readonly roomTypeSaving = signal(false);
  readonly roomTypePendingDelete = signal<TenantRoomType | null>(null);
  readonly roomTypeDeleting = signal(false);
  readonly roomTypeStatusModal = signal<{ title: string; message: string; tone: 'success' | 'error' } | null>(null);
  readonly equipmentFacilities = signal<TenantEquipmentFacility[]>([]);
  readonly equipmentFacilitySearchQuery = signal('');
  readonly equipmentFacilityFilter = signal('');
  readonly equipmentFacilitiesLoading = signal(false);
  readonly equipmentFacilitiesLoaded = signal(false);
  readonly equipmentFacilityLoadError = signal<string | null>(null);
  readonly showEquipmentFacilityModal = signal(false);
  readonly editingEquipmentFacility = signal<TenantEquipmentFacility | null>(null);
  readonly equipmentFacilityName = signal('');
  readonly equipmentFacilityDescription = signal('');
  readonly equipmentFacilityNameError = signal<string | null>(null);
  readonly equipmentFacilitySaveError = signal<string | null>(null);
  readonly equipmentFacilitySaving = signal(false);
  readonly equipmentFacilityPendingDelete = signal<TenantEquipmentFacility | null>(null);
  readonly equipmentFacilityDeleting = signal(false);
  readonly equipmentFacilityStatusModal = signal<{ title: string; message: string; tone: 'success' | 'error' } | null>(null);

  readonly settingsTabs = [
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

  readonly filteredRoomTypes = computed(() => {
    const query = this.roomTypeSearchQuery().trim().toLowerCase();
    const filter = this.roomTypeFilter();

    return this.roomTypes()
      .filter((roomType) => {
        const description = roomType.description ?? '';
        return !query
          || roomType.name.toLowerCase().includes(query)
          || description.toLowerCase().includes(query);
      })
      .filter((roomType) => {
        if (filter === 'with-description') {
          return !!roomType.description?.trim();
        }
        if (filter === 'without-description') {
          return !roomType.description?.trim();
        }
        return true;
      });
  });

  readonly filteredEquipmentFacilities = computed(() => {
    const query = this.equipmentFacilitySearchQuery().trim().toLowerCase();
    const filter = this.equipmentFacilityFilter();

    return this.equipmentFacilities()
      .filter((equipment) => {
        const description = equipment.description ?? '';
        return !query
          || equipment.name.toLowerCase().includes(query)
          || description.toLowerCase().includes(query);
      })
      .filter((equipment) => {
        if (filter === 'with-description') {
          return !!equipment.description?.trim();
        }
        if (filter === 'without-description') {
          return !equipment.description?.trim();
        }
        return true;
      });
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

  openUsersScreen(): void {
    this.activeTab.set('users');
  }

  async openCountriesScreen(): Promise<void> {
    await this.selectTab('country');
  }

  async openRoomTypesScreen(): Promise<void> {
    this.activeTab.set('room-types');
    if (!this.roomTypesLoaded()) {
      await this.loadRoomTypes();
    }
  }

  async openEquipmentFacilitiesScreen(): Promise<void> {
    this.activeTab.set('equipment-facilities');
    if (!this.equipmentFacilitiesLoaded()) {
      await this.loadEquipmentFacilities();
    }
  }

  async backToGeneral(): Promise<void> {
    await this.selectTab('general');
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

  async loadRoomTypes(): Promise<void> {
    if (this.roomTypesLoading()) {
      return;
    }
    this.roomTypesLoading.set(true);
    this.roomTypeLoadError.set(null);
    try {
      this.roomTypes.set(await this.tenantRoomTypeSettings.listRoomTypes());
      this.roomTypesLoaded.set(true);
    } catch {
      this.roomTypeLoadError.set('Unable to load room types. Please try again.');
    } finally {
      this.roomTypesLoading.set(false);
    }
  }

  openRoomTypeModal(): void {
    this.editingRoomType.set(null);
    this.roomTypeName.set('');
    this.roomTypeDescription.set('');
    this.roomTypeNameError.set(null);
    this.roomTypeSaveError.set(null);
    this.showRoomTypeModal.set(true);
  }

  openEditRoomTypeModal(roomType: TenantRoomType): void {
    this.editingRoomType.set(roomType);
    this.roomTypeName.set(roomType.name);
    this.roomTypeDescription.set(roomType.description ?? '');
    this.roomTypeNameError.set(null);
    this.roomTypeSaveError.set(null);
    this.showRoomTypeModal.set(true);
  }

  closeRoomTypeModal(): void {
    if (this.roomTypeSaving()) {
      return;
    }
    this.showRoomTypeModal.set(false);
    this.editingRoomType.set(null);
    this.roomTypeName.set('');
    this.roomTypeDescription.set('');
    this.roomTypeNameError.set(null);
    this.roomTypeSaveError.set(null);
  }

  async saveRoomType(): Promise<void> {
    if (this.roomTypeSaving()) {
      return;
    }
    const name = this.roomTypeName().trim();
    const description = this.roomTypeDescription().trim();
    this.roomTypeNameError.set(null);
    this.roomTypeSaveError.set(null);

    if (!name) {
      this.roomTypeNameError.set('Room type is required.');
      return;
    }

    this.roomTypeSaving.set(true);
    try {
      const editing = this.editingRoomType();
      const saved = editing
        ? await this.tenantRoomTypeSettings.updateRoomType(editing.id, { name, description: description || null })
        : await this.tenantRoomTypeSettings.createRoomType({ name, description: description || null });
      this.roomTypes.update((roomTypes) => {
        const next = editing
          ? roomTypes.map((roomType) => roomType.id === saved.id ? saved : roomType)
          : [...roomTypes, saved];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });
      this.showRoomTypeModal.set(false);
      this.editingRoomType.set(null);
      this.roomTypeName.set('');
      this.roomTypeDescription.set('');
      this.roomTypesLoaded.set(true);
      this.roomTypeStatusModal.set({
        title: editing ? 'Room type updated' : 'Room type added',
        message: `${saved.name} was saved successfully.`,
        tone: 'success',
      });
    } catch (error) {
      this.roomTypeSaveError.set(this.tenantRoomTypeSettings.toUserMessage(error));
    } finally {
      this.roomTypeSaving.set(false);
    }
  }

  confirmDeleteRoomType(roomType: TenantRoomType): void {
    if (this.roomTypeDeleting()) {
      return;
    }
    this.roomTypePendingDelete.set(roomType);
  }

  closeDeleteRoomTypeModal(): void {
    if (this.roomTypeDeleting()) {
      return;
    }
    this.roomTypePendingDelete.set(null);
  }

  async deleteRoomType(): Promise<void> {
    const roomType = this.roomTypePendingDelete();
    if (!roomType || this.roomTypeDeleting()) {
      return;
    }
    this.roomTypeDeleting.set(true);
    this.roomTypeLoadError.set(null);
    try {
      await this.tenantRoomTypeSettings.deleteRoomType(roomType.id);
      this.roomTypes.update((roomTypes) => roomTypes.filter((item) => item.id !== roomType.id));
      this.roomTypePendingDelete.set(null);
      this.roomTypeStatusModal.set({
        title: 'Room type deleted',
        message: `${roomType.name} was deleted successfully.`,
        tone: 'success',
      });
    } catch (error) {
      this.roomTypeStatusModal.set({
        title: 'Delete failed',
        message: this.tenantRoomTypeSettings.toUserMessage(error),
        tone: 'error',
      });
    } finally {
      this.roomTypeDeleting.set(false);
    }
  }

  closeRoomTypeStatusModal(): void {
    this.roomTypeStatusModal.set(null);
  }

  async loadEquipmentFacilities(): Promise<void> {
    if (this.equipmentFacilitiesLoading()) {
      return;
    }
    this.equipmentFacilitiesLoading.set(true);
    this.equipmentFacilityLoadError.set(null);
    try {
      this.equipmentFacilities.set(await this.tenantEquipmentFacilitySettings.listEquipmentFacilities());
      this.equipmentFacilitiesLoaded.set(true);
    } catch {
      this.equipmentFacilityLoadError.set('Unable to load equipment and facilities. Please try again.');
    } finally {
      this.equipmentFacilitiesLoading.set(false);
    }
  }

  openEquipmentFacilityModal(): void {
    this.editingEquipmentFacility.set(null);
    this.equipmentFacilityName.set('');
    this.equipmentFacilityDescription.set('');
    this.equipmentFacilityNameError.set(null);
    this.equipmentFacilitySaveError.set(null);
    this.showEquipmentFacilityModal.set(true);
  }

  openEditEquipmentFacilityModal(equipment: TenantEquipmentFacility): void {
    this.editingEquipmentFacility.set(equipment);
    this.equipmentFacilityName.set(equipment.name);
    this.equipmentFacilityDescription.set(equipment.description ?? '');
    this.equipmentFacilityNameError.set(null);
    this.equipmentFacilitySaveError.set(null);
    this.showEquipmentFacilityModal.set(true);
  }

  closeEquipmentFacilityModal(): void {
    if (this.equipmentFacilitySaving()) {
      return;
    }
    this.showEquipmentFacilityModal.set(false);
    this.editingEquipmentFacility.set(null);
    this.equipmentFacilityName.set('');
    this.equipmentFacilityDescription.set('');
    this.equipmentFacilityNameError.set(null);
    this.equipmentFacilitySaveError.set(null);
  }

  async saveEquipmentFacility(): Promise<void> {
    if (this.equipmentFacilitySaving()) {
      return;
    }
    const name = this.equipmentFacilityName().trim();
    const description = this.equipmentFacilityDescription().trim();
    this.equipmentFacilityNameError.set(null);
    this.equipmentFacilitySaveError.set(null);

    if (!name) {
      this.equipmentFacilityNameError.set('Equipment & Facilities is required.');
      return;
    }

    this.equipmentFacilitySaving.set(true);
    try {
      const editing = this.editingEquipmentFacility();
      const saved = editing
        ? await this.tenantEquipmentFacilitySettings.updateEquipmentFacility(editing.id, { name, description: description || null })
        : await this.tenantEquipmentFacilitySettings.createEquipmentFacility({ name, description: description || null });
      this.equipmentFacilities.update((equipmentFacilities) => {
        const next = editing
          ? equipmentFacilities.map((equipment) => equipment.id === saved.id ? saved : equipment)
          : [...equipmentFacilities, saved];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });
      this.showEquipmentFacilityModal.set(false);
      this.editingEquipmentFacility.set(null);
      this.equipmentFacilityName.set('');
      this.equipmentFacilityDescription.set('');
      this.equipmentFacilitiesLoaded.set(true);
      this.equipmentFacilityStatusModal.set({
        title: editing ? 'Equipment & Facilities updated' : 'Equipment & Facilities added',
        message: `${saved.name} was saved successfully.`,
        tone: 'success',
      });
    } catch (error) {
      this.equipmentFacilitySaveError.set(this.tenantEquipmentFacilitySettings.toUserMessage(error));
    } finally {
      this.equipmentFacilitySaving.set(false);
    }
  }

  confirmDeleteEquipmentFacility(equipment: TenantEquipmentFacility): void {
    if (this.equipmentFacilityDeleting()) {
      return;
    }
    this.equipmentFacilityPendingDelete.set(equipment);
  }

  closeDeleteEquipmentFacilityModal(): void {
    if (this.equipmentFacilityDeleting()) {
      return;
    }
    this.equipmentFacilityPendingDelete.set(null);
  }

  async deleteEquipmentFacility(): Promise<void> {
    const equipment = this.equipmentFacilityPendingDelete();
    if (!equipment || this.equipmentFacilityDeleting()) {
      return;
    }
    this.equipmentFacilityDeleting.set(true);
    this.equipmentFacilityLoadError.set(null);
    try {
      await this.tenantEquipmentFacilitySettings.deleteEquipmentFacility(equipment.id);
      this.equipmentFacilities.update((equipmentFacilities) => equipmentFacilities.filter((item) => item.id !== equipment.id));
      this.equipmentFacilityPendingDelete.set(null);
      this.equipmentFacilityStatusModal.set({
        title: 'Equipment & Facilities deleted',
        message: `${equipment.name} was deleted successfully.`,
        tone: 'success',
      });
    } catch (error) {
      this.equipmentFacilityStatusModal.set({
        title: 'Delete failed',
        message: this.tenantEquipmentFacilitySettings.toUserMessage(error),
        tone: 'error',
      });
    } finally {
      this.equipmentFacilityDeleting.set(false);
    }
  }

  closeEquipmentFacilityStatusModal(): void {
    this.equipmentFacilityStatusModal.set(null);
  }
}
