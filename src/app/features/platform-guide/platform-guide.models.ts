export interface PlatformGuideCard {
  id: number;
  title: string;
  titleAr: string | null;
  description: string;
  descriptionAr: string | null;
  imageUrl: string;
  videoUrl: string;
  visible: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformGuideCardPayload {
  title: string;
  titleAr: string | null;
  description: string;
  descriptionAr: string | null;
  imageUrl: string;
  videoUrl: string;
  visible: boolean;
  displayOrder: number;
}

export interface PlatformGuideAssetUpload {
  url: string;
  fileName: string;
  section: string;
  tenantId: string;
}
