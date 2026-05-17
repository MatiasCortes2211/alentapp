import { MedicalCertificateDTO } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';

export class GetMedicalCertificatesUseCase {
  constructor(
    private readonly medicalCertificateRepository: MedicalCertificateRepository
  ) {}

  async execute(memberId: string): Promise<MedicalCertificateDTO[]> {
    // 1. Validación básica de la regla de la aplicación
    if (!memberId || memberId.trim() === "") {
      throw new Error('El ID del socio es requerido');
    }

    // 2. Le pedimos al repositorio que traiga el historial ordenado
    const certificates = await this.medicalCertificateRepository.findByMemberId(memberId);

    return certificates;
  }
}