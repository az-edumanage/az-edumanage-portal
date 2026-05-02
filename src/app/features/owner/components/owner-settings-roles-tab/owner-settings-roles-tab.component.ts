import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-owner-settings-roles-tab',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './owner-settings-roles-tab.component.html',
  styleUrl: './owner-settings-roles-tab.component.css',
})
export class OwnerSettingsRolesTabComponent {
  readonly translate = input.required<(key: string) => string>();
}
