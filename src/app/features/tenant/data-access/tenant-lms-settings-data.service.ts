import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TenantLmsTemplateSummary {
  key: string;
  name: string;
  description: string;
  previewImageUrl: string | null;
}

export interface TenantLmsNavbarItem {
  key: string;
  label: string;
  route: string;
  enabled: boolean;
}

export interface TenantLmsNavbarSettings {
  logoImageUrl: string | null;
  navigation: TenantLmsNavbarItem[];
  primaryButtonRoute: string;
  secondaryButtonRoute: string;
}

export interface TenantLmsHeroStat {
  value: string;
  label: string;
}

export interface TenantLmsHeroSettings {
  badge: string;
  headline: string;
  highlightedHeadline: string;
  description: string;
  primaryButtonLabel: string;
  primaryButtonRoute: string;
  secondaryButtonLabel: string;
  secondaryButtonRoute: string;
  miniStats: TenantLmsHeroStat[];
  imageUrl: string;
  imageAlt: string;
  imageBadge: string;
  imageName: string;
  imageCaption: string;
  stats: TenantLmsHeroStat[];
}

export interface TenantLmsGradeItem {
  number: string;
  title: string;
  description: string;
  unitsLabel: string;
  actionLabel: string;
  route: string;
}

export interface TenantLmsGradesSettings {
  eyebrow: string;
  headline: string;
  description: string;
  items: TenantLmsGradeItem[];
}

export interface TenantLmsAboutStat {
  value: string;
  label: string;
}

export interface TenantLmsAboutTeacherSettings {
  eyebrow: string;
  headline: string;
  firstParagraphPrefix: string;
  experienceHighlight: string;
  firstParagraphSuffix: string;
  secondParagraph: string;
  imageUrl: string;
  imageAlt: string;
  stats: TenantLmsAboutStat[];
  signature: string;
}

export interface TenantLmsCourseItem {
  courseId: string;
  imageUrl: string;
  imageAlt: string;
  symbol: string;
  level: string;
  title: string;
  lessonsLabel: string;
  ratingLabel: string;
  price: string;
  oldPrice: string;
  actionLabel: string;
  route: string;
}

export interface TenantLmsCoursesSettings {
  eyebrow: string;
  headline: string;
  description: string;
  items: TenantLmsCourseItem[];
  allCoursesLabel: string;
  allCoursesRoute: string;
}

export type TenantLmsCourseMediaType = 'VIDEO' | 'PDF' | 'IMAGE' | 'AUDIO' | 'FILE' | 'LINK';
export interface TenantLmsCourseMedia { id: string; type: TenantLmsCourseMediaType; title: string; url: string; fileName: string; contentType: string; durationLabel: string; }
export interface TenantLmsCourseCurriculumNode { id: string; title: string; description: string; freePreview: boolean; media: TenantLmsCourseMedia[]; children: TenantLmsCourseCurriculumNode[]; }
export interface TenantLmsCourse {
  id: string; gradeId: string; gradeName: string; slug: string; title: string;
  subtitle: string | null; description: string | null; thumbnailUrl: string | null;
  previewMediaUrl: string | null; previewMediaType: string | null; price: number;
  oldPrice: number | null; currency: string; durationLabel: string | null;
  studentsLabel: string | null; ratingLabel: string | null; published: boolean;
  learningOutcomes: string[]; features: string[]; curriculum: TenantLmsCourseCurriculumNode[];
  createdAt: string; updatedAt: string;
}
export type SaveTenantLmsCourseRequest = Omit<TenantLmsCourse, 'id' | 'gradeName' | 'createdAt' | 'updatedAt'>;

export interface TenantLmsSettingsView {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  websiteHost?: string | null;
  websiteUrl?: string | null;
  lmsEnabled: boolean;
  websiteEnabled: boolean;
  selectedTemplateKey: string;
  templates: TenantLmsTemplateSummary[];
  brand: {
    teacherName: string;
    subject: string;
    audience: string;
    headline: string;
    subheadline: string;
    announcement: string;
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
    portraitImageUrl: string | null;
  };
  sections: Record<string, boolean>;
  navbar: TenantLmsNavbarSettings;
  hero: TenantLmsHeroSettings;
  grades: TenantLmsGradesSettings;
  aboutTeacher: TenantLmsAboutTeacherSettings;
  courses: TenantLmsCoursesSettings;
}

export interface SaveTenantLmsSettingsRequest {
  websiteEnabled: boolean;
  selectedTemplateKey: string;
  teacherName: string;
  subject: string;
  audience: string;
  headline: string;
  subheadline: string;
  announcement: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  portraitImageUrl: string | null;
  sections: Record<string, boolean>;
  navbar: TenantLmsNavbarSettings;
  hero: TenantLmsHeroSettings;
  grades: TenantLmsGradesSettings;
  aboutTeacher: TenantLmsAboutTeacherSettings;
  courses: TenantLmsCoursesSettings;
}

@Injectable({ providedIn: 'root' })
export class TenantLmsSettingsDataService {
  private readonly http = inject(HttpClient);

  getSettings(): Promise<TenantLmsSettingsView> {
    return firstValueFrom(this.http.get<TenantLmsSettingsView>(`${environment.apiBaseUrl}/tenant/lms-settings`));
  }

  saveSettings(payload: SaveTenantLmsSettingsRequest): Promise<TenantLmsSettingsView> {
    return firstValueFrom(this.http.put<TenantLmsSettingsView>(`${environment.apiBaseUrl}/tenant/lms-settings`, payload));
  }

  uploadHeroImage(file: File): Promise<{ url: string; fileName: string }> {
    const body = new FormData();
    body.append('file', file);
    return firstValueFrom(
      this.http.post<{ url: string; fileName: string }>(
        `${environment.apiBaseUrl}/tenant/lms-settings/hero-image`,
        body,
      ),
    );
  }

  uploadAboutTeacherImage(file: File): Promise<{ url: string; fileName: string }> {
    const body = new FormData();
    body.append('file', file);
    return firstValueFrom(
      this.http.post<{ url: string; fileName: string }>(
        `${environment.apiBaseUrl}/tenant/lms-settings/about-teacher-image`,
        body,
      ),
    );
  }

  uploadCourseThumbnail(file: File): Promise<{ url: string; fileName: string }> {
    const body = new FormData();
    body.append('file', file);
    return firstValueFrom(
      this.http.post<{ url: string; fileName: string }>(
        `${environment.apiBaseUrl}/tenant/lms-settings/course-thumbnail`,
        body,
      ),
    );
  }

  listManagedCourses(): Promise<TenantLmsCourse[]> {
    return firstValueFrom(this.http.get<TenantLmsCourse[]>(`${environment.apiBaseUrl}/tenant/lms-courses`));
  }

  createManagedCourse(payload: SaveTenantLmsCourseRequest): Promise<TenantLmsCourse> {
    return firstValueFrom(this.http.post<TenantLmsCourse>(`${environment.apiBaseUrl}/tenant/lms-courses`, payload));
  }

  updateManagedCourse(courseId: string, payload: SaveTenantLmsCourseRequest): Promise<TenantLmsCourse> {
    return firstValueFrom(this.http.put<TenantLmsCourse>(`${environment.apiBaseUrl}/tenant/lms-courses/${courseId}`, payload));
  }

  deleteManagedCourse(courseId: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${environment.apiBaseUrl}/tenant/lms-courses/${courseId}`));
  }

  uploadManagedCourseMedia(file: File): Promise<{ url: string; fileName: string; contentType: string; mediaType: TenantLmsCourseMediaType }> {
    const body = new FormData();
    body.append('file', file);
    return firstValueFrom(this.http.post<{ url: string; fileName: string; contentType: string; mediaType: TenantLmsCourseMediaType }>(`${environment.apiBaseUrl}/tenant/lms-courses/media`, body));
  }
}
