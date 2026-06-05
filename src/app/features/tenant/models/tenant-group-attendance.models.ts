export interface TenantAttendanceStudent {
  id: string;
  name: string;
  rfid: string | null;
  barcode: string | null;
  isPresent: boolean;
  attendanceState: 'Present' | 'Absent';
  manualStatus: 'Manual' | 'Auto';
  overrideChecks: string;
  attendanceRate: number;
  totalSessions: number;
  attendedSessions: number;
}

export interface TenantBarcodeAttendanceScanRequest {
  barcodeNumber: string;
  selectedGroupId: string | null;
}

export type TenantBarcodeAttendanceScanResult = 'PRESENT_RECORDED' | 'ALREADY_PRESENT' | 'NO_RUNNING_GROUP' | 'BARCODE_NOT_FOUND';

export interface TenantBarcodeAttendanceStudent {
  id: string;
  name: string;
  barcodeNumber: string;
}

export interface TenantBarcodeAttendanceGroup {
  id: string;
  name: string;
  startTime: string;
  duration: number;
}

export interface TenantBarcodeAttendanceRecord {
  state: 'Present';
  source: 'Auto';
  scanTime: string;
  sessionDate: string;
}

export interface TenantBarcodeAttendanceScanResponse {
  result: TenantBarcodeAttendanceScanResult;
  message: string;
  student: TenantBarcodeAttendanceStudent | null;
  group: TenantBarcodeAttendanceGroup | null;
  attendance: TenantBarcodeAttendanceRecord | null;
}


export interface TenantManualAttendanceRequest {
  groupId: string;
  studentId: string;
  attendanceState: 'Present' | 'Absent';
}

export interface TenantManualAttendanceResponse {
  groupId: string;
  studentId: string;
  attendanceState: 'Present' | 'Absent';
  source: 'Manual';
  scanTime: string;
  sessionDate: string;
  message: string;
}
