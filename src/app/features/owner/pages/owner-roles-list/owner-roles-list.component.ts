import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { OwnerRolesDataService } from '../../data-access/owner-roles-data.service';

@Component({
  selector: 'app-owner-roles-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  templateUrl: './owner-roles-list.component.html',
  styleUrl: './owner-roles-list.component.css',
})
export class OwnerRolesListComponent {
  private readonly rolesService = inject(OwnerRolesDataService);

  readonly search = signal('');
  readonly roles = this.rolesService.roles;

  readonly filteredRoles = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) {
      return this.roles();
    }

    return this.roles().filter((role) =>
      role.name.toLowerCase().includes(q) ||
      role.description.toLowerCase().includes(q),
    );
  });

  onDelete(id: string, isSystem: boolean): void {
    if (isSystem) {
      return;
    }

    this.rolesService.deleteRole(id);
  }
}
