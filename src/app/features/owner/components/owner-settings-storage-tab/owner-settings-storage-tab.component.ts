import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-owner-settings-storage-tab',
  imports: [CommonModule],
  templateUrl: './owner-settings-storage-tab.component.html',
  styleUrl: './owner-settings-storage-tab.component.css',
})
export class OwnerSettingsStorageTabComponent {
  readonly translate = input.required<(key: string) => string>();
}
