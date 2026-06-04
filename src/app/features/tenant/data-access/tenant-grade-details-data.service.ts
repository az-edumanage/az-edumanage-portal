import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { GradeDetails } from '../models/tenant-grade-details.models';
import { GradeGroupRow } from '../models/tenant-grades.models';
import { TenantGradesDataService } from './tenant-grades-data.service';

type GradeDetailsResponse = Omit<GradeDetails, 'groups'> & {
  groups?: GradeGroupRow[] | null;
};

@Injectable({ providedIn: 'root' })
export class TenantGradeDetailsDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly gradesData = inject(TenantGradesDataService);
  private readonly gradesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/grades`;

  async getGradeById(id: string): Promise<GradeDetails> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<GradeDetailsResponse>(`${this.gradesUrl}/${id}`));
    return {
      ...response,
      groups: response.groups ?? [],
    };
  }

  toUserMessage(error: unknown): string {
    return this.gradesData.toDetailUserMessage(error);
  }
}
