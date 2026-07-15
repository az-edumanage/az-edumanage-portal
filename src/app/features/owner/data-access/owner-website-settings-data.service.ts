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
  badgeTextAr?: string | null;
  titleText: string;
  titleTextAr?: string | null;
  descriptionText: string | null;
  descriptionTextAr?: string | null;
  backgroundImageUrl: string | null;
  primaryCtaLabel: string | null;
  primaryCtaLabelAr?: string | null;
  primaryCtaLink: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaLabelAr?: string | null;
  secondaryCtaLink: string | null;
  statOneValue?: string | null;
  statOneValueAr?: string | null;
  statOneLabel?: string | null;
  statOneLabelAr?: string | null;
  statTwoValue?: string | null;
  statTwoValueAr?: string | null;
  statTwoLabel?: string | null;
  statTwoLabelAr?: string | null;
  statThreeValue?: string | null;
  statThreeValueAr?: string | null;
  statThreeLabel?: string | null;
  statThreeLabelAr?: string | null;
  statFourValue?: string | null;
  statFourValueAr?: string | null;
  statFourLabel?: string | null;
  statFourLabelAr?: string | null;
  visible: boolean;
}

export interface PageConfig {
  pageKey: string;
  title: string;
  titleAr?: string | null;
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
  titleTextAr?: string | null;
  titleFontSize?: number | null;
  descriptionText: string | null;
  descriptionTextAr?: string | null;
  descriptionFontSize?: number | null;
  ctaLabel: string | null;
  ctaLabelAr?: string | null;
  ctaFontSize?: number | null;
  ctaLink: string | null;
  imageUrl?: string | null;
  detailTitle?: string | null;
  detailTitleAr?: string | null;
  detailSummary?: string | null;
  detailSummaryAr?: string | null;
  detailContent?: string | null;
  detailContentAr?: string | null;
  detailImageUrl?: string | null;
  detailEyebrow?: string | null;
  detailEyebrowAr?: string | null;
  detailPrimaryCtaLabel?: string | null;
  detailPrimaryCtaLabelAr?: string | null;
  detailPrimaryCtaLink?: string | null;
  detailSecondaryCtaLabel?: string | null;
  detailSecondaryCtaLabelAr?: string | null;
  detailSecondaryCtaLink?: string | null;
  detailTrustText?: string | null;
  detailTrustTextAr?: string | null;
  detailMockTitle?: string | null;
  detailMockTitleAr?: string | null;
  detailMockSubtitle?: string | null;
  detailMockSubtitleAr?: string | null;
  detailMockMeta?: string | null;
  detailMockMetaAr?: string | null;
  detailMockProgressValue?: string | null;
  detailMockProgressLabel?: string | null;
  detailMockProgressLabelAr?: string | null;
  detailMockStatOneLabel?: string | null;
  detailMockStatOneLabelAr?: string | null;
  detailMockStatOneValue?: string | null;
  detailMockStatTwoLabel?: string | null;
  detailMockStatTwoLabelAr?: string | null;
  detailMockStatTwoValue?: string | null;
  detailMockStatThreeLabel?: string | null;
  detailMockStatThreeLabelAr?: string | null;
  detailMockStatThreeValue?: string | null;
  detailMockScanName?: string | null;
  detailMockScanNameAr?: string | null;
  detailMockScanStatus?: string | null;
  detailMockScanStatusAr?: string | null;
  detailSectionTitle?: string | null;
  detailSectionTitleAr?: string | null;
  detailSectionDescription?: string | null;
  detailSectionDescriptionAr?: string | null;
  detailCards?: FeatureDetailCard[];
  detailCtaTitle?: string | null;
  detailCtaTitleAr?: string | null;
  detailCtaDescription?: string | null;
  detailCtaDescriptionAr?: string | null;
  detailCtaButtonLabel?: string | null;
  detailCtaButtonLabelAr?: string | null;
  detailCtaButtonLink?: string | null;
  visible: boolean;
  displayOrder: number;
}

export interface FeatureDetailCard {
  iconKey?: string | null;
  title?: string | null;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  displayOrder: number;
}

export interface TestimonialItem {
  quoteText: string;
  quoteTextAr?: string | null;
  authorName: string;
  authorNameAr?: string | null;
  authorRole: string | null;
  authorRoleAr?: string | null;
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
  titleTextAr?: string | null;
  descriptionText: string | null;
  descriptionTextAr?: string | null;
  buttonLabel: string | null;
  buttonLabelAr?: string | null;
  buttonLink: string | null;
  visible: boolean;
  displayOrder: number;
}

export interface FooterLink {
  sectionTitle: string;
  sectionTitleAr?: string | null;
  label: string;
  labelAr?: string | null;
  routePath: string;
  visible: boolean;
  displayOrder: number;
}

export interface MarketingPromoConfig {
  icon: string;
  text: string;
  textAr?: string | null;
  highlight: string;
  highlightAr?: string | null;
  suffixText: string;
  suffixTextAr?: string | null;
  ctaLabel: string;
  ctaLabelAr?: string | null;
}

export interface MarketingStepConfig {
  step: string;
  title: string;
  titleAr?: string | null;
  description: string;
  descriptionAr?: string | null;
}

export interface MarketingIntegrationsConfig {
  title: string;
  titleAr?: string | null;
  description: string;
  descriptionAr?: string | null;
  items: string[];
  itemsAr?: string[] | null;
  itemIcons: string[];
  bullets: string[];
  bulletsAr?: string[] | null;
}

export interface MarketingContactConfig {
  title: string;
  titleAr?: string | null;
  description: string;
  descriptionAr?: string | null;
  hqLabel: string;
  hqLabelAr?: string | null;
  hqValue: string;
  hqValueAr?: string | null;
}

export interface AboutPartnerConfig {
  name: string;
  nameAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  visible: boolean;
  displayOrder: number;
}

export interface AboutContentConfig {
  missionBadge?: string | null;
  missionBadgeAr?: string | null;
  heroTitle?: string | null;
  heroTitleAr?: string | null;
  heroDescription?: string | null;
  heroDescriptionAr?: string | null;
  storyTitle?: string | null;
  storyTitleAr?: string | null;
  storyLead?: string | null;
  storyLeadAr?: string | null;
  storyBody?: string | null;
  storyBodyAr?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  imageAltAr?: string | null;
  valuesTitle?: string | null;
  valuesTitleAr?: string | null;
  partnersTitle?: string | null;
  partnersTitleAr?: string | null;
  partnersDescription?: string | null;
  partnersDescriptionAr?: string | null;
  partners: AboutPartnerConfig[];
}

export interface TermsSectionConfig {
  icon?: string | null;
  title?: string | null;
  titleAr?: string | null;
  body?: string | null;
  bodyAr?: string | null;
  bullets?: string[] | null;
  bulletsAr?: string[] | null;
  visible: boolean;
  displayOrder: number;
}

export interface TermsContentConfig {
  title?: string | null;
  titleAr?: string | null;
  lastUpdated?: string | null;
  lastUpdatedAr?: string | null;
  contactText?: string | null;
  contactTextAr?: string | null;
  contactEmail?: string | null;
  sections: TermsSectionConfig[];
}

export interface MarketingConfig {
  promo: MarketingPromoConfig;
  steps: MarketingStepConfig[];
  integrations: MarketingIntegrationsConfig;
  contact: MarketingContactConfig;
  featuresSectionTitle?: string | null;
  featuresSectionTitleAr?: string | null;
  featuresSectionDescription?: string | null;
  featuresSectionDescriptionAr?: string | null;
  pricingSectionTitle?: string | null;
  pricingSectionTitleAr?: string | null;
  pricingSectionDescription?: string | null;
  pricingSectionDescriptionAr?: string | null;
  pricingAudienceTeacherLabel?: string | null;
  pricingAudienceTeacherLabelAr?: string | null;
  pricingAudienceCenterLabel?: string | null;
  pricingAudienceCenterLabelAr?: string | null;
  pricingBillingAnnualLabel?: string | null;
  pricingBillingAnnualLabelAr?: string | null;
  pricingBillingMonthlyLabel?: string | null;
  pricingBillingMonthlyLabelAr?: string | null;
  trustedHeading?: string | null;
  trustedHeadingAr?: string | null;
  trustedDescription?: string | null;
  trustedDescriptionAr?: string | null;
  trustedStatOneValue?: string | null;
  trustedStatOneValueAr?: string | null;
  trustedStatOneLabel?: string | null;
  trustedStatOneLabelAr?: string | null;
  trustedStatTwoValue?: string | null;
  trustedStatTwoValueAr?: string | null;
  trustedStatTwoLabel?: string | null;
  trustedStatTwoLabelAr?: string | null;
  trustedStatThreeValue?: string | null;
  trustedStatThreeValueAr?: string | null;
  trustedStatThreeLabel?: string | null;
  trustedStatThreeLabelAr?: string | null;
  docsVideoUrl?: string | null;
  docsSectionTitle?: string | null;
  docsSectionTitleAr?: string | null;
  docsSectionDescription?: string | null;
  docsSectionDescriptionAr?: string | null;
  docsVideos?: { title?: string | null; url: string }[];
  facebookPixelId?: string | null;
  about?: AboutContentConfig | null;
  terms?: TermsContentConfig | null;
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
