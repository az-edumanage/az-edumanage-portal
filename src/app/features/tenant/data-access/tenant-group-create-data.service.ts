import { Injectable } from '@angular/core';
import { Observable, map, timer } from 'rxjs';
import {
  TenantGroupPayload,
  TenantGroupSelectorOption,
} from '../models/tenant-group-create.models';

@Injectable({ providedIn: 'root' })
export class TenantGroupCreateDataService {
  readonly teachers: TenantGroupSelectorOption[] = [
    { id: '1', name: 'Dr. Ahmed Zewail', subtitle: 'Physics' },
    { id: '2', name: 'Prof. Mona Helmy', subtitle: 'Mathematics' },
    { id: '3', name: 'Mr. Khaled Said', subtitle: 'Chemistry' },
    { id: '4', name: 'Ms. Fatma Ali', subtitle: 'Biology' },
    { id: '5', name: 'Dr. Mostafa El-Sayed', subtitle: 'Chemistry' },
    { id: '6', name: 'Prof. Farouk El-Baz', subtitle: 'Geology' },
  ];

  readonly grades: TenantGroupSelectorOption[] = [
    { id: '1', name: 'Grade 10', subtitle: 'Secondary' },
    { id: '2', name: 'Grade 11', subtitle: 'Secondary' },
    { id: '3', name: 'Grade 12', subtitle: 'Secondary' },
    { id: '4', name: 'Primary 1', subtitle: 'Primary' },
    { id: '5', name: 'Primary 2', subtitle: 'Primary' },
  ];

  readonly subjects: TenantGroupSelectorOption[] = [
    { id: '1', name: 'Physics' },
    { id: '2', name: 'Mathematics' },
    { id: '3', name: 'Chemistry' },
    { id: '4', name: 'Biology' },
    { id: '5', name: 'English' },
    { id: '6', name: 'Arabic' },
  ];

  readonly rooms: TenantGroupSelectorOption[] = [
    { id: '1', name: 'Lab 101', subtitle: 'Laboratory' },
    { id: '2', name: 'Room 204', subtitle: 'Classroom' },
    { id: '3', name: 'Virtual Room A', subtitle: 'Virtual' },
    { id: '4', name: 'Main Hall', subtitle: 'Auditorium' },
  ];

  createOrUpdateGroup(payload: TenantGroupPayload): Observable<void> {
    void payload;
    return timer(1500).pipe(map(() => void 0));
  }
}
