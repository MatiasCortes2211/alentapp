import { CreateMedicalCertificate } from '@alentapp/shared';
import { CreateMedicalCertificateSchema } from './MedicalCertificateSchema.js';
import { z } from 'zod';

export class MedicalCertificateValidator {
  /**
   * Valida tanto la estructura de datos (Zod) como las reglas de negocio puras.
   */
  validate(data: CreateMedicalCertificate): void {
    // 1. Validación estructural estricta (Zod)
    try {
      CreateMedicalCertificateSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Creamos un diccionario con tus mensajes exactos del TDD
        const errorMessages: Record<string, string> = {
          issue_date: "La fecha de emisión es obligatoria",
          expiry_date: "La fecha de vencimiento es obligatoria",
          doctor_license: "La matrícula del médico es obligatoria",
          member_id: "El ID del socio debe ser un UUID válido"
        };

        // Recorremos los fallos de Zod. Si un campo falló, extraemos nuestro mensaje en español
        const messages = error.issues.map(issue => {
          const fieldName = issue.path[0] as string;
          return errorMessages[fieldName] || issue.message;
        });

        // Eliminamos mensajes duplicados por si un campo falló por múltiples razones
        const uniqueMessages = Array.from(new Set(messages)).join(", ");
        throw new Error(uniqueMessages);
      }
      throw error;
    }

    // 2. Reglas de negocio puras del dominio (Solo si los datos son estructuralmente válidos)
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