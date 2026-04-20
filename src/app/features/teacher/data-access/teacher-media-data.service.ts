import { Injectable, signal } from '@angular/core';
import { MediaItem } from '../models/teacher-media.models';

@Injectable({ providedIn: 'root' })
export class TeacherMediaDataService {
  readonly mediaItems = signal<MediaItem[]>([
    { id: '1', title: 'Mid-term Physics Quiz', type: 'Exam', date: 'Feb 20, 2026', group: 'Physics G12-A' },
    { id: '2', title: 'Quantum Mechanics Intro', type: 'Video', date: 'Feb 18, 2026', size: '124 MB' },
    { id: '3', title: 'Session 04 Notes', type: 'PDF', date: 'Feb 15, 2026', size: '2.4 MB' },
    { id: '4', title: 'Lab Experiment Diagram', type: 'Image', date: 'Feb 14, 2026', size: '800 KB' },
    { id: '5', title: 'Final Revision Exam', type: 'Exam', date: 'Feb 10, 2026', group: 'Physics G12-B' },
    { id: '6', title: 'Gravitational Waves', type: 'Video', date: 'Feb 05, 2026', size: '450 MB' },
  ]);
}
