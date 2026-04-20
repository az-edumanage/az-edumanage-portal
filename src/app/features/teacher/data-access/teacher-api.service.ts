import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TeacherSummary } from '../models/teacher.models';

@Injectable({ providedIn: 'root' })
export class TeacherApiService {
  getSummary(): Observable<TeacherSummary> {
    return of({
      sessionsToday: 0,
      groups: 0,
      attendanceRate: 0,
    });
  }
}
