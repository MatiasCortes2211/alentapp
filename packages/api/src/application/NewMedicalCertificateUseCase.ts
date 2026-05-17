import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { MedicalCertificateValidator } from '../domain/services/MedicalCertificateValidator.js';
import { MedicalCertificateDTO, CreateMedicalCertificate } from '@alentapp/shared';

export class NewMedicalCertificateUseCase {
    constructor(
        private readonly certificateRepository: MedicalCertificateRepository,
        private readonly memberRepository: MemberRepository,
        private readonly validator: MedicalCertificateValidator
    ) { }

    async execute(data: CreateMedicalCertificate): Promise<MedicalCertificateDTO> {
        // 1. Validaciones de estructura (Zod) y reglas de negocio de fechas (Arriba de todo, estilo AlentApp)
        // Se delega toda la lógica de validación a un Domain Service especializado.
        this.validator.validate(data);

        // 2. Verificar la existencia del socio
        const member = await this.memberRepository.findById(data.member_id);
        if (!member) {
            throw new Error('Socio inexistente');
        }

        // 3. Regla de Negocio: Invalidar automáticamente certificados anteriores
        await this.certificateRepository.invalidatePriorCertificates(data.member_id);

        // 4. Persistencia
        const newCertificate = await this.certificateRepository.create(data);

        return newCertificate;
    }
}