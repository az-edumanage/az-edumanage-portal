import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-owner-settings-communication-tab',
  imports: [CommonModule],
  templateUrl: './owner-settings-communication-tab.component.html',
  styleUrl: './owner-settings-communication-tab.component.css',
})
export class OwnerSettingsCommunicationTabComponent {
  readonly translate = input.required<(key: string) => string>();
}
