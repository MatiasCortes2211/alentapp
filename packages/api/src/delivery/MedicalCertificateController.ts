import { FastifyRequest, FastifyReply } from 'fastify';
import { NewMedicalCertificateUseCase } from '../application/NewMedicalCertificateUseCase.js';
import { GetMedicalCertificatesUseCase } from '../application/GetMedicalCertificatesUseCase.js';
import { UpdateMedicalCertificateUseCase } from '../application/UpdateMedicalCertificateUseCase.js'; 
import { CreateMedicalCertificate, UpdateMedicalCertificate } from '@alentapp/shared';

export class MedicalCertificateController {
  constructor(
    private readonly newMedicalCertificateUseCase: NewMedicalCertificateUseCase,
    private readonly getMedicalCertificatesUseCase: GetMedicalCertificatesUseCase,
    private readonly updateMedicalCertificateUseCase: UpdateMedicalCertificateUseCase 
  ) {}

  async create(
    request: FastifyRequest<{ Body: CreateMedicalCertificate }>,
    reply: FastifyReply
  ) {
    try {
      const certificate = await this.newMedicalCertificateUseCase.execute(request.body);
      return reply.status(201).send({ data: certificate });

    } catch (error: any) {
      if (error.message.includes('Socio inexistente')) {
        return reply.status(404).send({ error: error.message });
      }

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

      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

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
  // 🚀 MÉTODO UPDATE ADAPTADO Y CORREGIDO
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
      // 1. Capturamos si el ID es inválido o si las fechas son incoherentes (400 Bad Request)
      if (
        error.statusCode === 400 || 
        error.message.includes('400') || 
        error.message.includes('Fechas inválidas') ||
        error.message.includes('válido')
      ) {
        const cleanMessage = error.message.replace('400: ', '');
        return reply.status(400).send({ message: cleanMessage });
      }

      // 2. Capturamos si el recurso no existe en PostgreSQL (404 Not Found)
      if (error.statusCode === 404 || error.message.includes('404') || error.message.includes('inexistente')) {
        const cleanMessage = error.message.replace('404: ', '');
        return reply.status(404).send({ error: cleanMessage });
      }

      // 3. Fallo de infraestructura o base de datos (500 Internal Server Error)
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
}