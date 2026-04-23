import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TeacherMediaFacade } from '../../state/teacher-media.facade';

@Component({
  selector: 'app-teacher-media',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './teacher-media.component.html',
  styleUrl: './teacher-media.component.css'})
export class TeacherMediaComponent {
  private readonly facade = inject(TeacherMediaFacade);

  readonly tabs = this.facade.tabs;
  readonly activeTab = this.facade.activeTab;
  readonly filteredMedia = this.facade.filteredMedia;

  setActiveTab(tab: string): void {
    this.facade.setActiveTab(tab);
  }

  getIcon(type: string): string {
    return this.facade.getIcon(type);
  }
}
