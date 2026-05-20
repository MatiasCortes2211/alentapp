import { MedicalCertificateDTO, CreateMedicalCertificate, UpdateMedicalCertificate } from '@alentapp/shared';

export interface MedicalCertificateRepository {

  // Registra un nuevo certificado médico 
  create(data: CreateMedicalCertificate): Promise<MedicalCertificateDTO>;

  // Invalida todos los certificados médicos previos de un socio específico, marcándolos como no válidos
  invalidatePriorCertificates(memberId: string): Promise<void>;

  // Busca los certificados médicos de un socio por su ID 
  findByMemberId(memberId: string): Promise<MedicalCertificateDTO[]>;
  
  // Busca un certificado médico específico por su ID único para validar si existe
  findById(id: string): Promise<MedicalCertificateDTO | null>;

  // Actualiza parcialmente los campos del certificado (ej. is_validated: false)
  update(id: string, data: UpdateMedicalCertificate): Promise<MedicalCertificateDTO>;

  // Remueve físicamente el registro de la base de datos de manera segura
  delete(id: string): Promise<void>;
}