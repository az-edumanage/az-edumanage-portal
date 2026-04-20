import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { OwnerSettingsFacade } from '../state/owner-settings.facade';

@Component({
  selector: 'app-owner-settings',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './owner-settings.component.html',
  styleUrl: './owner-settings.component.css'})
export class OwnerSettingsComponent {
  private readonly facade = inject(OwnerSettingsFacade);

  readonly activeTab = this.facade.activeTab;
  readonly subscriptionCycles = this.facade.subscriptionCycles;
  readonly paymentMethods = this.facade.paymentMethods;
  readonly tabs = this.facade.tabs;

  addCycle() {
    this.facade.addCycle();
  }

  removeCycle(id: number) {
    this.facade.removeCycle(id);
  }

  addPaymentMethod() {
    this.facade.addPaymentMethod();
  }

  removePaymentMethod(id: number) {
    this.facade.removePaymentMethod(id);
  }

  savePresets() {
    this.facade.savePresets();
  }
}
