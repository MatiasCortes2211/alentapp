import { CreateMedicalCertificate } from '@alentapp/shared';

export class MedicalCertificateValidator {
  /**
   * Valida las reglas de negocio puras del certificado.
   * Se coloca en un Domain Service porque esta lógica es una "verdad absoluta"
   * del dominio, independiente de la persistencia o el transporte.
   */

  // Reglas de negocio:

  validate(data: CreateMedicalCertificate): void {
    const issueDate = new Date(data.issue_date);
    const expiryDate = new Date(data.expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Regla 1: La fecha de vencimiento debe ser posterior a la fecha de emisión.
    if (expiryDate <= issueDate) {
      throw new Error('La fecha de vencimiento debe ser posterior a la de emisión');
    }

    // Regla 2: No se pueden cargar certificados con fecha de vencimiento pasada.
    if (expiryDate < today) {
      throw new Error('No se puede cargar un certificado con fecha de vencimiento pasada');
    }
  }
}