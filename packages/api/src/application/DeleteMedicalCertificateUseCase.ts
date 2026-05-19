import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { DeleteMedicalCertificateParamsSchema } from '../domain/services/MedicalCertificateSchema.js';


export class DeleteMedicalCertificateUseCase {
    constructor(
        private readonly repository: MedicalCertificateRepository
    ) {}

    async execute(id: string): Promise<void> {
        // 1. Extraer el ID y validar su formato con Zod
        const validation = DeleteMedicalCertificateParamsSchema.safeParse({ id });
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
        await this.repository.delete(id);
    }
}