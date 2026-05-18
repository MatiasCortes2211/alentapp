import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { z } from 'zod';

// Esquema de Zod para validar que el ID recibido sea un UUID válido
const deleteParamsSchema = z.string().uuid({ message: 'El id debe tener formato UUID válido.' });

export class DeleteMedicalCertificateUseCase {
    constructor(
        private readonly repository: MedicalCertificateRepository
    ) {}

    async execute(id: string): Promise<void> {
        // 1. Extraer el ID y validar su formato con Zod
        const validation = deleteParamsSchema.safeParse(id);
        if (!validation.success) {
            const error = new Error(validation.error.issues[0].message);
            (error as any).statusCode = 400; // Bad Request
            throw error;
        }

        // 2. Verificar existencia previa del certificado médico
        const existingCertificate = await this.repository.findById(id);
        if (!existingCertificate) {
            const error = new Error('Recurso Inexistente: El certificado que se intenta eliminar no está en la DB.');
            (error as any).statusCode = 404; // Not Found
            throw error;
        }

        // 3. Si existe y el ID es correcto, procedemos al borrado físico seguro
        try {
            await this.repository.delete(id);
        } catch (err: any) {
            // Manejo de conflictos de integridad o caídas de DB
            if (err.code === 'P2003') { // Código de restricción de clave foránea en Prisma
                const error = new Error('Conflicto de integridad: El certificado posee dependencias externas que impiden su borrado físico.');
                (error as any).statusCode = 409; // Conflict
                throw error;
            }
            (err as any).statusCode = 500; // Internal Server Error
            throw err;
        }
    }
}