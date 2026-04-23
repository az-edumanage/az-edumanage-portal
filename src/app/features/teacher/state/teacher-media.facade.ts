import { Injectable, inject } from '@angular/core';
import { TeacherMediaStore } from './teacher-media.store';

@Injectable({ providedIn: 'root' })
export class TeacherMediaFacade {
  private readonly store = inject(TeacherMediaStore);

  readonly tabs = this.store.tabs;
  readonly activeTab = this.store.activeTab;
  readonly filteredMedia = this.store.filteredMedia;

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  getIcon(type: string): string {
    switch (type) {
      case 'Exam':
        return 'assignment';
      case 'Video':
        return 'play_circle';
      case 'PDF':
        return 'picture_as_pdf';
      case 'Image':
        return 'image';
      default:
        return 'insert_drive_file';
    }
  }
}
