import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { SubscriptionPresetService } from '../../../core/services/subscription-preset.service';

@Component({
  selector: 'app-owner-settings',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './owner-settings.component.html',
  styleUrl: './owner-settings.component.css'})
export class OwnerSettingsComponent {
  private presetService = inject(SubscriptionPresetService);
  activeTab = signal('general');

  subscriptionCycles = signal([...this.presetService.cycles()]);
  paymentMethods = signal([...this.presetService.paymentMethods()]);

  tabs = [
    { id: 'general', label: 'General' },
    { id: 'presets', label: 'Presets & Methods' },
    { id: 'security', label: 'Security' },
    { id: 'billing', label: 'Billing' },
    { id: 'communication', label: 'Communication' },
    { id: 'storage', label: 'Storage' },
    { id: 'compliance', label: 'Audit & Compliance' },
  ];

  addCycle() {
    const current = this.subscriptionCycles();
    const newId = current.length > 0 ? Math.max(...current.map(c => c.id)) + 1 : 1;
    this.subscriptionCycles.update(current => [
      ...current,
      { id: newId, name: 'New Cycle', days: 30, icon: 'event', active: true }
    ]);
  }

  removeCycle(id: number) {
    this.subscriptionCycles.update(current => current.filter(c => c.id !== id));
  }

  addPaymentMethod() {
    const current = this.paymentMethods();
    const newId = current.length > 0 ? Math.max(...current.map(m => m.id)) + 1 : 1;
    this.paymentMethods.update(current => [
      ...current,
      { id: newId, name: 'New Method', description: 'Method description', icon: 'payment', active: true }
    ]);
  }

  removePaymentMethod(id: number) {
    this.paymentMethods.update(current => current.filter(m => m.id !== id));
  }

  savePresets() {
    this.presetService.updateCycles(this.subscriptionCycles());
    this.presetService.updatePaymentMethods(this.paymentMethods());
    // Optional: Show success toast
    console.log('Presets saved to service');
  }
}
