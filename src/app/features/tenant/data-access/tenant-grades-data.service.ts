import { Injectable, signal } from '@angular/core';
import { Grade } from '../models/tenant-grades.models';

@Injectable({ providedIn: 'root' })
export class TenantGradesDataService {
  readonly grades = signal<Grade[]>([
    {
      id: '1',
      name: 'Grade 10',
      level: 'Secondary',
      studentCount: 120,
      description: 'First year of secondary education.',
    },
    {
      id: '2',
      name: 'Grade 11',
      level: 'Secondary',
      studentCount: 110,
      description: 'Second year of secondary education.',
    },
    {
      id: '3',
      name: 'Grade 12',
      level: 'Secondary',
      studentCount: 95,
      description: 'Final year of secondary education.',
    },
    {
      id: '4',
      name: 'Primary 1',
      level: 'Primary',
      studentCount: 80,
      description: 'First year of primary education.',
    },
    {
      id: '5',
      name: 'Primary 2',
      level: 'Primary',
      studentCount: 85,
      description: 'Second year of primary education.',
    },
  ]);
}
