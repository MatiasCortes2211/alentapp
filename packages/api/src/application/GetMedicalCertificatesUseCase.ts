import { MedicalCertificateDTO } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';

export class GetMedicalCertificatesUseCase {
  constructor(
    private readonly medicalCertificateRepository: MedicalCertificateRepository,
    private readonly memberRepository: MemberRepository
  ) {}

  async execute(memberId: string): Promise<MedicalCertificateDTO[]> {
    // 1. Validación básica de la regla de la aplicación
    if (!memberId || memberId.trim() === "") {
      throw new Error('El ID del socio es requerido');
    }

    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      throw new Error('Socio inexistente');
    }

    // 2. Le pedimos al repositorio que traiga el historial ordenado
    const certificates = await this.medicalCertificateRepository.findByMemberId(memberId);

    return certificates;
  }
}