import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpParams, HttpRequest } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface WebsiteSettingsView {
  tenantId: string;
  siteConfig: SiteConfig;
  hero: HomeHero;
  pages: PageConfig[];
  navigation: NavLink[];
  features: FeatureItem[];
  testimonials: TestimonialItem[];
  pricingPlans: PricingPlan[];
  ctas: CtaBlock[];
  footerLinks: FooterLink[];
  marketing: MarketingConfig | null;
  onboarding: OnboardingConfig | null;
  trialDashboard: TrialDashboardConfig | null;
  published: boolean;
  publishedAt: string | null;
}

export interface SiteConfig {
  siteName: string;
  supportEmail: string | null;
  contactPhone: string | null;
  primaryLocale: string;
  defaultCurrency: string;
}

export interface HomeHero {
  badgeText: string | null;
  titleText: string;
  descriptionText: string | null;
  backgroundImageUrl: string | null;
  primaryCtaLabel: string | null;
  primaryCtaLink: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaLink: string | null;
  visible: boolean;
}

export interface PageConfig {
  pageKey: string;
  title: string;
  routePath: string;
  visible: boolean;
  displayOrder: number;
}

export interface NavLink {
  label: string;
  routePath: string;
  linkType: string;
  visible: boolean;
  displayOrder: number;
}

export interface FeatureItem {
  iconKey: string;
  titleText: string;
  titleFontSize?: number | null;
  descriptionText: string | null;
  descriptionFontSize?: number | null;
  ctaLabel: string | null;
  ctaFontSize?: number | null;
  ctaLink: string | null;
  imageUrl?: string | null;
  detailTitle?: string | null;
  detailSummary?: string | null;
  detailContent?: string | null;
  detailImageUrl?: string | null;
  visible: boolean;
  displayOrder: number;
}

export interface TestimonialItem {
  quoteText: string;
  authorName: string;
  authorRole: string | null;
  avatarUrl: string | null;
  visible: boolean;
  displayOrder: number;
}

export interface PricingPlanFeature {
  featureText: string;
  included: boolean;
  displayOrder: number;
}

export interface PricingPlan {
  planKey: string;
  nameText: string;
  subtitleText: string | null;
  priceText: string;
  ctaLabel: string | null;
  badgeLabel: string | null;
  visible: boolean;
  displayOrder: number;
  features: PricingPlanFeature[];
}

export interface CtaBlock {
  ctaKey: string;
  titleText: string;
  descriptionText: string | null;
  buttonLabel: string | null;
  buttonLink: string | null;
  visible: boolean;
  displayOrder: number;
}

export interface FooterLink {
  sectionTitle: string;
  label: string;
  routePath: string;
  visible: boolean;
  displayOrder: number;
}

export interface MarketingPromoConfig {
  icon: string;
  text: string;
  highlight: string;
  suffixText: string;
  ctaLabel: string;
}

export interface MarketingStepConfig {
  step: string;
  title: string;
  description: string;
}

export interface MarketingIntegrationsConfig {
  title: string;
  description: string;
  items: string[];
  itemIcons: string[];
  bullets: string[];
}

export interface MarketingContactConfig {
  title: string;
  description: string;
  hqLabel: string;
  hqValue: string;
}

export interface MarketingConfig {
  promo: MarketingPromoConfig;
  steps: MarketingStepConfig[];
  integrations: MarketingIntegrationsConfig;
  contact: MarketingContactConfig;
  docsVideoUrl?: string | null;
  docsVideos?: { title?: string | null; url: string }[];
}

export interface OnboardingConfig {
  stepOneTitle: string;
  stepOneDescription: string;
  trustBadgeText: string;
  planSelectorBadge: string;
  provisioningTitle: string;
  provisioningDescription: string;
  successTitle: string;
  successDescription: string;
  provisioningTasks: string[];
}

export interface TrialSetupStep {
  label: string;
  description: string;
  status: string;
}

export interface TrialDashboardConfig {
  headerTitle: string;
  headerDescription: string;
  trialRemainingText: string;
  trialEndsText: string;
  trialFeatureBullets: string[];
  setupSteps: TrialSetupStep[];
}

export interface SaveWebsiteSettingsRequest {
  siteConfig: SiteConfig;
  hero: HomeHero;
  pages: PageConfig[];
  navigation: NavLink[];
  features: FeatureItem[];
  testimonials: TestimonialItem[];
  pricingPlans: PricingPlan[];
  ctas: CtaBlock[];
  footerLinks: FooterLink[];
  marketing: MarketingConfig;
  onboarding: OnboardingConfig;
  trialDashboard: TrialDashboardConfig;
}

@Injectable({ providedIn: 'root' })
export class OwnerWebsiteSettingsDataService {
  private readonly http = inject(HttpClient);

  async getSettings(tenantId: string): Promise<WebsiteSettingsView> {
    return firstValueFrom(this.http.get<WebsiteSettingsView>(`${environment.apiBaseUrl}/owner/website-settings/${tenantId}`));
  }

  async saveDraft(tenantId: string, payload: SaveWebsiteSettingsRequest): Promise<WebsiteSettingsView> {
    return firstValueFrom(
      this.http.put<WebsiteSettingsView>(`${environment.apiBaseUrl}/owner/website-settings/${tenantId}/draft`, payload),
    );
  }

  async publish(tenantId: string): Promise<WebsiteSettingsView> {
    return firstValueFrom(
      this.http.post<WebsiteSettingsView>(`${environment.apiBaseUrl}/owner/website-settings/${tenantId}/publish`, {}),
    );
  }

  uploadWebsiteAssetWithProgress(
    tenantId: string,
    section: string,
    file: File,
  ): Observable<HttpEvent<{ url: string; fileName: string; section: string; tenantId: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    const request = new HttpRequest(
      'POST',
      `${environment.apiBaseUrl}/owner/website-settings/${tenantId}/assets/upload`,
      formData,
      { params: new HttpParams().set('section', section), reportProgress: true },
    );
    return this.http.request<{ url: string; fileName: string; section: string; tenantId: string }>(request);
  }

  async uploadWebsiteAsset(
    tenantId: string,
    section: string,
    file: File,
  ): Promise<{ url: string; fileName: string; section: string; tenantId: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return firstValueFrom(
      this.http.post<{ url: string; fileName: string; section: string; tenantId: string }>(
        `${environment.apiBaseUrl}/owner/website-settings/${tenantId}/assets/upload`,
        formData,
        { params: new HttpParams().set('section', section) },
      ),
    );
  }

  async deleteWebsiteAsset(
    tenantId: string,
    section: string,
    fileName: string,
  ): Promise<{ deleted: boolean }> {
    return firstValueFrom(
      this.http.delete<{ deleted: boolean }>(
        `${environment.apiBaseUrl}/owner/website-settings/${tenantId}/assets/${section}/${encodeURIComponent(fileName)}`,
      ),
    );
  }
}
