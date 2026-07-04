export interface ParentChild {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  barcodeNumber?: string | null;
  gender?: string | null;
  birthDate?: string | null;
}

export interface ParentAttendance {
  id: string;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  sessionDate?: string | null;
  arrivalTime?: string | null;
  status: string;
  source?: string | null;
}

export interface ParentInvoice {
  id: string;
  invoiceRef: string;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  amount: number;
  currency: string;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  dueDate?: string | null;
  status: string;
}

export interface ParentOverview {
  summary: {
    childrenCount: number;
    weeklySessionsCount: number;
    totalRecordedAttendance: number;
    unpaidInvoicesCount: number;
  };
  attendance: {
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
  };
  childAttendance: Array<{
    studentName: string;
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
  }>;
  invoiceStatus: Array<{
    status: string;
    count: number;
  }>;
  recentAttendance: ParentAttendance[];
  recentInvoices: ParentInvoice[];
}
