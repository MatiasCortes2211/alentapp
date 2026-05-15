import { MedicalCertificateDTO, CreateMedicalCertificate } from '@alentapp/shared';

// Esta interfaz es el "Puerto de Salida". El dominio dice: 
// "No me importa si usás Postgres o Mongo, dame un objeto que cumpla esto".

export interface MedicalCertificateRepository {

  //Registra un nuevo certificado médico (TDD-0007)
  create(data: CreateMedicalCertificate): Promise<MedicalCertificateDTO>;

  /**
   * El dominio requiere que quien se encargue de la persistencia sepa cómo
   * (invalidar) los certificados viejos de un socio antes de cargar uno nuevo.
   * No especifica el "cómo" técnico, solo la necesidad de esta acción para 
   * cumplir el criterio de aceptación del PRD.
   */
  invalidatePriorCertificates(memberId: string): Promise<void>;
}