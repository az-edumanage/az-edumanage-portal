export interface Group {
  id: string;
  name: string;
  teacher: string;
  subject: string;
  studentsCount: number;
  schedule: string;
  startAt?: string | null;
  duration?: number | null;
  room: string;
  pricePerStudent?: number;
  ownedBy?: string;
  educationCategory?: 'BASIC_EDUCATION' | 'UNIVERSITY_EDUCATION';
}
