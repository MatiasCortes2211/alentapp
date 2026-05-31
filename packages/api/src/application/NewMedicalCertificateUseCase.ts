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
        this.validator.validate(data);

        // Verificar la existencia del socio
        const member = await this.memberRepository.findById(data.member_id);
        if (!member) {
            throw new Error('Socio inexistente');
        }

        // Validación de negocio: El socio no puede estar suspendido
        if (member.status === 'Suspendido') {
            throw new Error('No se permiten realizar acciones sobre certificados médicos de un socio suspendido');
        }

        // Regla de Negocio: Invalidar automáticamente certificados anteriores
        await this.certificateRepository.invalidatePriorCertificates(data.member_id);

        // Persistencia
        const newCertificate = await this.certificateRepository.create(data);

        return newCertificate;
    }
}