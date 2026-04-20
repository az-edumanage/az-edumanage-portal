import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { OwnerAcademicStructureDetailsFacade } from '../state/owner-academic-structure-details.facade';

@Component({
  selector: 'app-owner-academic-structure-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-academic-structure-details.component.html',
  styleUrl: './owner-academic-structure-details.component.css'})
export class OwnerAcademicStructureDetailsComponent {
  private readonly facade = inject(OwnerAcademicStructureDetailsFacade);

  readonly activeTab = this.facade.activeTab;
  readonly tabs = this.facade.tabs;
  readonly features = this.facade.features;
  readonly limits = this.facade.limits;
  readonly availablePlans = this.facade.availablePlans;
  readonly overrides = this.facade.overrides;
  readonly changeLogs = this.facade.changeLogs;
}
