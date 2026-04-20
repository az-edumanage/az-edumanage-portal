export interface Plan {
  id: string;
  name: string;
  status: 'Active' | 'Archived';
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  maxStudents: number;
  maxStorage: number;
  trialDays: number;
  visibility: 'Public' | 'Private';
}
