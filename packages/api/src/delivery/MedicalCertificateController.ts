import { FastifyRequest, FastifyReply } from 'fastify';
import { NewMedicalCertificateUseCase } from '../application/NewMedicalCertificateUseCase.js';
import { CreateMedicalCertificate } from '@alentapp/shared';

export class MedicalCertificateController {
  constructor(
    private readonly newMedicalCertificateUseCase: NewMedicalCertificateUseCase
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
}