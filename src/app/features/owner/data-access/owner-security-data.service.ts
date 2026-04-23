import { Injectable } from '@angular/core';
import { map, Observable, timer } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OwnerSecurityDataService {
  saveAuthPolicies(payload: Record<string, unknown>): Observable<void> {
    void payload;
    return timer(450).pipe(map(() => void 0));
  }

  saveMfaPolicies(payload: Record<string, unknown>): Observable<void> {
    void payload;
    return timer(450).pipe(map(() => void 0));
  }

  saveSessionPolicies(payload: Record<string, unknown>): Observable<void> {
    void payload;
    return timer(450).pipe(map(() => void 0));
  }

  saveApiPolicies(payload: Record<string, unknown>): Observable<void> {
    void payload;
    return timer(450).pipe(map(() => void 0));
  }

  saveDataProtection(payload: Record<string, unknown>): Observable<void> {
    void payload;
    return timer(450).pipe(map(() => void 0));
  }
}
