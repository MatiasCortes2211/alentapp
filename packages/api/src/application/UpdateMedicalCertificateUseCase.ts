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
            throw new Error('400: El id debe tener formato UUID válido.');
        }

        // 2. Verificar si el certificado médico realmente existe en la base de datos
        const existingCertificate = await this.repository.findById(id);
        if (!existingCertificate) {
            throw new Error('404: Recurso Inexistente. El certificado no fue encontrado.');
        }

        // 3. Si pasó las validaciones, mandamos a actualizar los campos parciales
        const updatedCertificate = await this.repository.update(id, data);
        
        return updatedCertificate;
    }
}