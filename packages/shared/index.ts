// ==========================================
// Member
// ==========================================

export type MemberCategory = 'Pleno' | 'Cadete' | 'Honorario';
export type MemberStatus = 'Activo' | 'Moroso' | 'Suspendido';

export interface MemberDTO {
  id: string; // UUID
  dni: string;
  name: string;
  email: string;
  birthdate: string; // ISO Date String (YYYY-MM-DD)
  category: MemberCategory;
  status: MemberStatus;
  created_at: string; // ISO Date String
}

export interface CreateMemberRequest {
  dni: string;
  name: string;
  email: string;
  birthdate: string; // ISO Date String (YYYY-MM-DD)
  category: MemberCategory;
}

export interface UpdateMemberRequest {
  dni?: string;
  name?: string;
  email?: string;
  birthdate?: string; // ISO Date String (YYYY-MM-DD)
  category?: MemberCategory;
  status?: MemberStatus;
}

// ==========================================
// Locker
// ==========================================
export type LockerStatus = 'Available' | 'Occupied' | 'Maintenance';
export type LockerLocation = 'Male' | 'Female' | 'Kids';

export interface LockerDTO {
  id: string; // UUID
  number: number;
  location: LockerLocation;
  status: LockerStatus;
  end_contract_date: string | null;
  member_id: string | null;
  is_deleted: boolean;
}

export interface CreateLockerRequest {
  number: number;
  location: LockerLocation;
  status?: LockerStatus;
  end_contract_date?: string | null;
  member_id?: string | null;
}

export interface UpdateLockerRequest {
  number?: number;
  location?: LockerLocation;
  status?: LockerStatus;
  end_contract_date?: string | null;
  member_id?: string | null;
  is_deleted?: boolean;
}

// ==========================================
// Medical Certificate
// ==========================================
export interface MedicalCertificateDTO {
  id: string;
  issue_date: string;
  expiry_date: string;
  doctor_license: string;
  is_validated: boolean;
  member_id: string;
}

export interface CreateMedicalCertificate {
  issue_date: string;
  expiry_date: string;
  doctor_license: string;
  member_id: string;
}

// ==========================================
// Payment
// ==========================================
export enum PaymentStatus {
  Pending = 'PENDING',
  Paid = 'PAID',
  Canceled = 'CANCELED'
}

export interface PaymentDTO {
  id: string; // UUID
  amount: number;
  month: number;
  year: number;
  status: PaymentStatus;
  due_date: string; // ISO Date String (YYYY-MM-DD)
  payment_date?: string | null; // ISO Date String (YYYY-MM-DD)
  is_deleted: boolean;
  member_id: string; // UUID
}

export interface CreatePaymentRequest {
  amount: number;
  month: number;
  year: number;
  due_date: string; // ISO Date String (YYYY-MM-DD)
  member_id: string; // UUID
}

// ==========================================
// Sport
// ==========================================
export interface Sport {
  id: string; // UUID
  name: string;
  description: string;
  max_capacity: number;
  additional_price: number;
  requires_medical_certificate: boolean;
  is_deleted: boolean;
}

export interface CreateSport {
  name: string;
  description: string;
  max_capacity: number;
  additional_price: number;
  requires_medical_certificate: boolean;
}

// ==========================================
// Discipline
// ==========================================
export interface Discipline {
  id: string; // UUID
  reason: string;
  start_date: string;
  end_date: string;
  is_total_suspension: boolean;
  member_id: string;
  is_deleted: boolean;
}

export interface CreateDiscipline {
  reason: string;
  start_date: string; // ISO Date String (YYYY-MM-DD)
  end_date: string; // ISO Date String (YYYY-MM-DD)
  is_total_suspension: boolean;
  member_id: string; // UUID
}