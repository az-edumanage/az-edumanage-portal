import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

interface MediaItem {
  id: string;
  title: string;
  type: 'Exam' | 'Video' | 'PDF' | 'Image';
  date: string;
  size?: string;
  group?: string;
}

@Component({
  selector: 'app-teacher-media',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './teacher-media.component.html',
  styleUrl: './teacher-media.component.css'})
export class TeacherMediaComponent {
  tabs = ['All', 'Exams', 'Videos', 'PDFs', 'Images'];
  activeTab = signal('All');

  mediaItems = signal<MediaItem[]>([
    { id: '1', title: 'Mid-term Physics Quiz', type: 'Exam', date: 'Feb 20, 2026', group: 'Physics G12-A' },
    { id: '2', title: 'Quantum Mechanics Intro', type: 'Video', date: 'Feb 18, 2026', size: '124 MB' },
    { id: '3', title: 'Session 04 Notes', type: 'PDF', date: 'Feb 15, 2026', size: '2.4 MB' },
    { id: '4', title: 'Lab Experiment Diagram', type: 'Image', date: 'Feb 14, 2026', size: '800 KB' },
    { id: '5', title: 'Final Revision Exam', type: 'Exam', date: 'Feb 10, 2026', group: 'Physics G12-B' },
    { id: '6', title: 'Gravitational Waves', type: 'Video', date: 'Feb 05, 2026', size: '450 MB' },
  ]);

  filteredMedia = () => {
    const tab = this.activeTab();
    if (tab === 'All') return this.mediaItems();
    const type = tab.slice(0, -1); // Remove 's' from 'Exams', 'Videos', etc.
    return this.mediaItems().filter(item => item.type === type);
  };

  getIcon(type: string): string {
    switch (type) {
      case 'Exam': return 'assignment';
      case 'Video': return 'play_circle';
      case 'PDF': return 'picture_as_pdf';
      case 'Image': return 'image';
      default: return 'insert_drive_file';
    }
  }
}
