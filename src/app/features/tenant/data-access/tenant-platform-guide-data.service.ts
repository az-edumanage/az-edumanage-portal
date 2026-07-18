import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PlatformGuideCard } from '../../platform-guide/platform-guide.models';

@Injectable({ providedIn: 'root' })
export class TenantPlatformGuideDataService {
  private readonly http = inject(HttpClient);

  list(): Observable<PlatformGuideCard[]> {
    return this.http.get<PlatformGuideCard[]>(`${environment.apiBaseUrl}/tenant/platform-user-guide`);
  }
}
