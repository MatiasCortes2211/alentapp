import { FastifyRequest, FastifyReply } from 'fastify';
import { NewMedicalCertificateUseCase } from '../application/NewMedicalCertificateUseCase.js';
import { GetMedicalCertificatesUseCase } from '../application/GetMedicalCertificatesUseCase.js';
import { UpdateMedicalCertificateUseCase } from '../application/UpdateMedicalCertificateUseCase.js'; 
import { DeleteMedicalCertificateUseCase } from '../application/DeleteMedicalCertificateUseCase.js';
import { CreateMedicalCertificate, UpdateMedicalCertificate } from '@alentapp/shared';
import { recordRequest, recordError, recordDuration, activeRequestsGauge } from '../infrastructure/telemetry.js';

export class MedicalCertificateController {
  constructor(
    private readonly newMedicalCertificateUseCase: NewMedicalCertificateUseCase,
    private readonly getMedicalCertificatesUseCase: GetMedicalCertificatesUseCase,
    private readonly updateMedicalCertificateUseCase: UpdateMedicalCertificateUseCase, 
    private readonly deleteMedicalCertificateUseCase: DeleteMedicalCertificateUseCase 
  ) {}

  async create(
    request: FastifyRequest<{ Body: CreateMedicalCertificate }>,
    reply: FastifyReply
  ) {
    const start = Date.now();
    const method = request.method;
    const route = request.url.split('?')[0];
    let statusCode = 201;
    activeRequestsGauge.add(1);
    try {
      const certificate = await this.newMedicalCertificateUseCase.execute(request.body);
      return reply.status(statusCode).send({ data: certificate });
    } catch (error: any) {
      statusCode = 500;
      if (error.message.includes('Socio inexistente')) {
        statusCode = 404;
      } else if (
        error.message.includes('obligatoria') || 
        error.message.includes('vencimiento') || 
        error.message.includes('emisión') || 
        error.message.includes('válido') ||
        error.message.includes('invalid') ||
        error.message.includes('Required') ||
        error.message.includes('suspendido')
      ) {
        statusCode = 400;
      }
      recordError(route, method, statusCode);
      return reply.status(statusCode).send({ error: error.message || 'Internal server error' });
    } finally {
      recordRequest(route, method, statusCode);
      recordDuration(Date.now() - start, route, method);
      activeRequestsGauge.add(-1);
    }
  }

  async getByMember(
    request: FastifyRequest<{ Params: { memberId: string } }>,
    reply: FastifyReply
  ) {
    const start = Date.now();
    const method = request.method;
    const route = request.url.split('?')[0];
    let statusCode = 200;
    activeRequestsGauge.add(1);
    try {
      const { memberId } = request.params;
      const certificates = await this.getMedicalCertificatesUseCase.execute(memberId);
      return reply.status(statusCode).send({ data: certificates });
    } catch (error: any) {
      statusCode = 500;
      if (error.message.includes('requerido')) {
        statusCode = 400;
      } else if (error.message.includes('Socio inexistente')) {
        statusCode = 404;
      }
      recordError(route, method, statusCode);
      return reply.status(statusCode).send({ error: error.message || 'Internal server error' });
    } finally {
      recordRequest(route, method, statusCode);
      recordDuration(Date.now() - start, route, method);
      activeRequestsGauge.add(-1);
    }
  }

  async update(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateMedicalCertificate }>,
    reply: FastifyReply
  ) {
    const start = Date.now();
    const method = request.method;
    const route = request.url.split('?')[0];
    let statusCode = 200;
    activeRequestsGauge.add(1);
    try {
      const { id } = request.params;
      const updatedCertificate = await this.updateMedicalCertificateUseCase.execute(id, request.body);
      return reply.status(statusCode).send({ data: updatedCertificate });
    } catch (error: any) {
      statusCode = 500;
      if (error.statusCode === 400 || error.message.includes('400') || error.message.includes('Fechas inválidas') || error.message.includes('válido') || error.message.includes('Suspendido') || error.message.includes('socio')) {
        statusCode = 400;
      } else if (error.statusCode === 404 || error.message.includes('404') || error.message.includes('inexistente')) {
        statusCode = 404;
      }
      recordError(route, method, statusCode);
      return reply.status(statusCode).send({ error: error.message || 'Internal server error' });
    } finally {
      recordRequest(route, method, statusCode);
      recordDuration(Date.now() - start, route, method);
      activeRequestsGauge.add(-1);
    }
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const start = Date.now();
    const method = request.method;
    const route = request.url.split('?')[0];
    let statusCode = 204;
    activeRequestsGauge.add(1);
    try {
      const { id } = request.params;
      await this.deleteMedicalCertificateUseCase.execute(id);
      return reply.status(statusCode).send();
    } catch (error: any) {
      statusCode = 500;
      if (error.statusCode === 400 || error.message.includes('válido')) {
        statusCode = 400;
      } else if (error.statusCode === 404 || error.message.includes('Inexistente')) {
        statusCode = 404;
      } else if (error.statusCode === 409 || error.message.includes('integridad')) {
        statusCode = 409;
      }
      recordError(route, method, statusCode);
      return reply.status(statusCode).send({ error: error.message || 'Internal server error' });
    } finally {
      recordRequest(route, method, statusCode);
      recordDuration(Date.now() - start, route, method);
      activeRequestsGauge.add(-1);
    }
  }
}