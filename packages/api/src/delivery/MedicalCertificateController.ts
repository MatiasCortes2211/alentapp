import { FastifyRequest, FastifyReply } from 'fastify';
import { NewMedicalCertificateUseCase } from '../application/NewMedicalCertificateUseCase.js';
import { CreateMedicalCertificate } from '@alentapp/shared';
import { GetMedicalCertificatesUseCase } from '../application/GetMedicalCertificatesUseCase.js';

export class MedicalCertificateController {
  constructor(
    private readonly newMedicalCertificateUseCase: NewMedicalCertificateUseCase,
    private readonly getMedicalCertificatesUseCase: GetMedicalCertificatesUseCase
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

  // NUEVO MÉTODO AGREGADO ABAJO PARA EL READ:
  async getByMember(
    request: FastifyRequest<{ Params: { memberId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { memberId } = request.params;
      const certificates = await this.getMedicalCertificatesUseCase.execute(memberId);
      
      // Devolvemos el array con un estado 200 OK
      return reply.status(200).send({ data: certificates });

    } catch (error: any) {
      // Si el ID vino vacío o inválido y saltó la regla del Use Case
      if (error.message.includes('requerido')) {
        return reply.status(400).send({ message: error.message });
      }

      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
}