import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ModuleCategory } from '../models/owner-modules.models';
import { OwnerModulesListFacade } from '../state/owner-modules-list.facade';

@Component({
  selector: 'app-owner-modules-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-modules-list.component.html'})
export class OwnerModulesListComponent {
  private readonly facade = inject(OwnerModulesListFacade);

  readonly filter = this.facade.filter;
  readonly filteredModules = this.facade.filteredModules;

  setFilter(value: 'All' | ModuleCategory): void {
    this.facade.setFilter(value);
  }
}
