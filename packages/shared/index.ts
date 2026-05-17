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