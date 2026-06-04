export interface TenantGroupStudent {
  id: string;
  name: string;
  email: string;
  grade: string;
}

export interface TenantGroupEligibleStudentsResponse {
  groupId: string;
  educationCategory: string;
  students: TenantGroupStudent[];
}

export interface TenantGroupStudentEnrollForm {
  enrollDate: string;
  discount: number;
  sendNotification: boolean;
  generateInitialInvoice: boolean;
}

export interface TenantGroupStudentEnrollmentPayload extends TenantGroupStudentEnrollForm {
  studentIds: string[];
}

export interface TenantGroupStudentEnrollmentResult {
  groupId: string;
  enrolledStudentIds: string[];
  skippedStudentIds: string[];
}
