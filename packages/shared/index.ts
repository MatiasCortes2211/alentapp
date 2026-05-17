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
// Medical Certificate
// ==========================================
// este es el objeto completo del certificado médico que se devuelve al cliente
export interface MedicalCertificateDTO {
  id: string;
  issue_date: string;
  expiry_date: string;
  doctor_license: string;
  is_validated: boolean;
  member_id: string;
}

// este es el objeto que se recibe del cliente para crear un nuevo certificado médico
export interface CreateMedicalCertificate {
  issue_date: string;
  expiry_date: string;
  doctor_license: string;
  member_id: string;
}
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
