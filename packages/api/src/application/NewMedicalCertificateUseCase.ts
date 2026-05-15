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

    // aca se orquesta la lógica de negocio, pero no se mete en detalles de validación o persistencia, que se delegan a otros componentes especializados.
    async execute(data: CreateMedicalCertificate): Promise<MedicalCertificateDTO> {
        // 1. Verificar la existencia del socio
        const member = await this.memberRepository.findById(data.member_id);
        if (!member) {
            throw new Error('Socio inexistente');
        }

        // 2. Validaciones de fechas y reglas de negocio del certificado
        // Se delega toda la lógica de validación a un Domain Service especializado, manteniendo el caso de uso limpio y enfocado en la orquestación.
        this.validator.validate(data);

        // 3. Regla de Negocio: Invalidar automáticamente certificados anteriores
        await this.certificateRepository.invalidatePriorCertificates(data.member_id);

        // 4. Persistencia
        const newCertificate = await this.certificateRepository.create(data);

        return newCertificate;
    }
}