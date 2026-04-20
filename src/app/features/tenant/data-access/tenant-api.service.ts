import { Injectable } from '@angular/core';
import { Observable, map, of, timer } from 'rxjs';
import { TenantSummary } from '../models/tenant.models';

@Injectable({ providedIn: 'root' })
export class TenantApiService {
  getSummary(): Observable<TenantSummary> {
    return of({
      students: 0,
      teachers: 0,
      groups: 0,
    });
  }

  createGrade(payload: Record<string, unknown>): Observable<Record<string, unknown>> {
    return timer(1000).pipe(map(() => payload));
  }

  createOrUpdateGroup(payload: Record<string, unknown>): Observable<Record<string, unknown>> {
    return timer(1500).pipe(map(() => payload));
  }

  createGroupExam(payload: Record<string, unknown>): Observable<Record<string, unknown>> {
    return timer(1500).pipe(map(() => payload));
  }

  enrollStudentToGroup(payload: Record<string, unknown>): Observable<Record<string, unknown>> {
    return timer(1500).pipe(map(() => payload));
  }

  bookRoom(payload: Record<string, unknown>): Observable<Record<string, unknown>> {
    return timer(1500).pipe(map(() => payload));
  }

  createOrUpdateRoom(payload: Record<string, unknown>): Observable<Record<string, unknown>> {
    return timer(1500).pipe(map(() => payload));
  }

  enrollStudent(payload: Record<string, unknown>): Observable<Record<string, unknown>> {
    return timer(1500).pipe(map(() => payload));
  }

  createOrUpdateTeacher(payload: Record<string, unknown>): Observable<Record<string, unknown>> {
    return timer(1500).pipe(map(() => payload));
  }

  createUser(payload: Record<string, unknown>): Observable<Record<string, unknown>> {
    return timer(1500).pipe(map(() => payload));
  }
}
