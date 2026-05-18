import { FastifyRequest, FastifyReply } from 'fastify';
import { NewMedicalCertificateUseCase } from '../application/NewMedicalCertificateUseCase.js';
import { GetMedicalCertificatesUseCase } from '../application/GetMedicalCertificatesUseCase.js';
import { UpdateMedicalCertificateUseCase } from '../application/UpdateMedicalCertificateUseCase.js'; // 👈 1. IMPORTAR EL CASO DE USO
import { CreateMedicalCertificate, UpdateMedicalCertificate } from '@alentapp/shared';

export class MedicalCertificateController {
  constructor(
    private readonly newMedicalCertificateUseCase: NewMedicalCertificateUseCase,
    private readonly getMedicalCertificatesUseCase: GetMedicalCertificatesUseCase,
    private readonly updateMedicalCertificateUseCase: UpdateMedicalCertificateUseCase // 👈 2. INYECTAR COMO TERCERA DEPENDENCIA
  ) {}

  async create(
    request: FastifyRequest<{ Body: CreateMedicalCertificate }>,
    reply: FastifyReply
  ) {
    try {
      const certificate = await this.newMedicalCertificateUseCase.execute(request.body);
      return reply.status(201).send({ data: certificate });

    } catch (error: any) {
      // 1. Socio inexistente (404 Not Found)
      if (error.message.includes('Socio inexistente')) {
        return reply.status(404).send({ error: error.message });
      }

      // 2. Captura total de errores de validación (estructurales, vacíos o de negocio)
      if (
        error.message.includes('obligatoria') || 
        error.message.includes('vencimiento') || 
        error.message.includes('emisión') || 
        error.message.includes('válido') ||
        error.message.includes('invalid') ||
        error.message.includes('Required')
      ) {
        return reply.status(400).send({ message: error.message });
      }

      // 3. Fallo genérico controlado
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  // MÉTODO PARA EL READ:
  async getByMember(
    request: FastifyRequest<{ Params: { memberId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { memberId } = request.params;
      const certificates = await this.getMedicalCertificatesUseCase.execute(memberId);
      
      return reply.status(200).send({ data: certificates });

    } catch (error: any) {
      if (error.message.includes('requerido')) {
        return reply.status(400).send({ message: error.message });
      }

      if (error.message.includes('Socio inexistente')) {
        return reply.status(404).send({ error: error.message });
      }

      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  // =========================================================================
  // 🚀 3. NUEVO MÉTODO IMPLEMENTADO PARA EL UPDATE:
  // =========================================================================
  async update(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateMedicalCertificate }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const updatedCertificate = await this.updateMedicalCertificateUseCase.execute(id, request.body);

      return reply.status(200).send({ data: updatedCertificate });

    } catch (error: any) {
      // Si el id de la URL no es un UUID válido (Frena Zod)
      if (error.message.includes('400')) {
        return reply.status(400).send({ message: error.message.replace('400: ', '') });
      }

      // Si el certificado médico no existe en la base de datos
      if (error.message.includes('404')) {
        return reply.status(404).send({ error: error.message.replace('404: ', '') });
      }

      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
}