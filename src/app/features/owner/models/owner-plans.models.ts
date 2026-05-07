export interface Plan {
  id: string;
  name: string;
  audienceType: 'center' | 'teacher';
  status: 'Active' | 'Archived' | 'Draft';
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  maxStudents: number;
  maxStorage: number;
  trialDays: number;
  visibility: 'Public' | 'Private';
  isRecommended: boolean;
  showAnnualPrice: boolean;
}
