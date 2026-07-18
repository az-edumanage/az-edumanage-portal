import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PlatformGuideAssetUpload,
  PlatformGuideCard,
  PlatformGuideCardPayload,
} from '../../platform-guide/platform-guide.models';

@Injectable({ providedIn: 'root' })
export class OwnerPlatformGuideDataService {
  private readonly http = inject(HttpClient);
  private readonly guideUrl = `${environment.apiBaseUrl}/owner/platform-user-guide`;
  private readonly assetUrl = `${environment.apiBaseUrl}/owner/website-settings/platform-guide/assets/upload`;

  list(): Observable<PlatformGuideCard[]> {
    return this.http.get<PlatformGuideCard[]>(this.guideUrl);
  }

  create(payload: PlatformGuideCardPayload): Observable<PlatformGuideCard> {
    return this.http.post<PlatformGuideCard>(this.guideUrl, payload);
  }

  update(id: number, payload: PlatformGuideCardPayload): Observable<PlatformGuideCard> {
    return this.http.put<PlatformGuideCard>(`${this.guideUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.guideUrl}/${id}`);
  }

  upload(file: File, section: 'platform-guide-image' | 'platform-guide-video'): Observable<PlatformGuideAssetUpload> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<PlatformGuideAssetUpload>(
      this.assetUrl,
      formData,
      { params: new HttpParams().set('section', section) },
    );
  }
}
