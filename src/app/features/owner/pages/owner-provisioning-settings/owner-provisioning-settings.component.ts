import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OwnerProvisioningSettingsFacade } from '../../state/owner-provisioning-settings.facade';
import { FORM_COMPONENTS } from '../../../../shared/components/form';

@Component({
  selector: 'app-owner-provisioning-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule, ...FORM_COMPONENTS],
  templateUrl: './owner-provisioning-settings.component.html',
  styleUrl: './owner-provisioning-settings.component.css'})
export class OwnerProvisioningSettingsComponent implements OnInit, OnDestroy {
  private readonly facade = inject(OwnerProvisioningSettingsFacade);

  readonly settingsForm = this.facade.settingsForm;

  ngOnInit(): void {
    this.facade.initialize();
  }

  ngOnDestroy(): void {
    this.facade.onDestroy();
  }

  onCancel(): void {
    this.facade.onCancel();
  }

  saveSettings(): void {
    this.facade.saveSettings();
  }
}
