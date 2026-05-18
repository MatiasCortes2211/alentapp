import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateDTO, UpdateMedicalCertificate } from '@alentapp/shared';
import { z } from 'zod';

// Esquema de Zod para validar que el ID de la URL sea un UUID correcto
const idParamSchema = z.string().uuid({ message: 'El id debe tener formato UUID válido.' });

export class UpdateMedicalCertificateUseCase {
    constructor(
        private readonly repository: MedicalCertificateRepository
    ) {}

    async execute(id: string, data: UpdateMedicalCertificate): Promise<MedicalCertificateDTO> {
        // 1. Validar que el ID de la URL tenga el formato UUID reglamentario
        const validation = idParamSchema.safeParse(id);
        if (!validation.success) {
            const error = new Error(validation.error.issues[0].message);
            (error as any).statusCode = 400; // Bad Request
            throw error;
        }

        // 2. Verificar si el certificado médico realmente existe en la base de datos
        const existingCertificate = await this.repository.findById(id);
        if (!existingCertificate) {
            const error = new Error('Recurso inexistente: Intento de modificar un certificado que no está en la base de datos.');
            (error as any).statusCode = 404; // Not Found
            throw error;
        }

        // 🚀 REGLA TDD-0008: Validar coherencia si viene una nueva fecha de vencimiento
        if (data.expiry_date) {
            const newExpiry = new Date(data.expiry_date);
            const originalIssue = new Date(existingCertificate.issue_date);

            if (newExpiry <= originalIssue) {
                const error = new Error('Fechas inválidas: Si al actualizar, la nueva fecha de vencimiento resulta menor o igual a la de emisión.');
                (error as any).statusCode = 400; // Bad Request
                throw error;
            }
        }

        // 🚀 REGLA DE NEGOCIO: Evitar duplicidad de estados activos en el historial
        // Si administrativamente se está activando este certificado viejo
        if (data.is_validated === true) {
            // Apagamos todos los certificados que pertenezcan a este socio primero
            await this.repository.invalidatePriorCertificates(existingCertificate.member_id);
        }

        // 3. Si pasó las validaciones, mandamos a actualizar los campos parciales
        try {
            const updatedCertificate = await this.repository.update(id, data);
            return updatedCertificate;
        } catch (err: any) {
            (err as any).statusCode = 500; // Error de Infraestructura
            throw err;
        }
    }
}