export interface TenantGroupStudent {
  id: string;
  name: string;
  email: string;
  grade: string;
}

export interface TenantGroupStudentEnrollForm {
  enrollDate: string;
  discount: number;
  sendNotification: boolean;
  generateInitialInvoice: boolean;
}
