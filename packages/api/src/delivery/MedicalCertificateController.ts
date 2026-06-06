import { FastifyRequest, FastifyReply } from 'fastify';
import { NewMedicalCertificateUseCase } from '../application/NewMedicalCertificateUseCase.js';
import { GetMedicalCertificatesUseCase } from '../application/GetMedicalCertificatesUseCase.js';
import { UpdateMedicalCertificateUseCase } from '../application/UpdateMedicalCertificateUseCase.js'; 
import { DeleteMedicalCertificateUseCase } from '../application/DeleteMedicalCertificateUseCase.js';
import { CreateMedicalCertificate, UpdateMedicalCertificate } from '@alentapp/shared';
import { requestCounter, errorCounter, requestDuration, activeRequestsGauge } from '../infrastructure/telemetry.js';

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
    activeRequestsGauge.add(1);
    try {
      const certificate = await this.newMedicalCertificateUseCase.execute(request.body);
      requestCounter.add(1, { method, route, status: '201' });
      return reply.status(201).send({ data: certificate });

    } catch (error: any) {
      if (error.message.includes('Socio inexistente')) {
        errorCounter.add(1, { method, route, status: '404' });
        return reply.status(404).send({ error: error.message });
      }

      if (
        error.message.includes('obligatoria') || 
        error.message.includes('vencimiento') || 
        error.message.includes('emisión') || 
        error.message.includes('válido') ||
        error.message.includes('invalid') ||
        error.message.includes('Required') ||
        error.message.includes('suspendido')
      ) {
        errorCounter.add(1, { method, route, status: '400' });
        return reply.status(400).send({ message: error.message });
      }

      request.log.error(error);
      errorCounter.add(1, { method, route, status: '500' });
      return reply.status(500).send({ error: 'Internal server error' });
    } finally {
      requestDuration.record(Date.now() - start, { method, route });
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
    activeRequestsGauge.add(1);
    try {
      const { memberId } = request.params;
      const certificates = await this.getMedicalCertificatesUseCase.execute(memberId);
      requestCounter.add(1, { method, route, status: '200' });
      return reply.status(200).send({ data: certificates });

    } catch (error: any) {
      if (error.message.includes('requerido')) {
        errorCounter.add(1, { method, route, status: '400' });
        return reply.status(400).send({ message: error.message });
      }

      if (error.message.includes('Socio inexistente')) {
        errorCounter.add(1, { method, route, status: '404' });
        return reply.status(404).send({ error: error.message });
      }

      request.log.error(error);
      errorCounter.add(1, { method, route, status: '500' });
      return reply.status(500).send({ error: 'Internal server error' });
    } finally {
      requestDuration.record(Date.now() - start, { method, route });
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
    activeRequestsGauge.add(1);
    try {
      const { id } = request.params;
      const updatedCertificate = await this.updateMedicalCertificateUseCase.execute(id, request.body);
      requestCounter.add(1, { method, route, status: '200' });
      return reply.status(200).send({ data: updatedCertificate });

    } catch (error: any) {
      // 1. Capturamos si el ID es inválido, si las fechas son incoherentes o si el socio esta suspendido (400 Bad Request)
      if (
        error.statusCode === 400 || 
        error.message.includes('400') || 
        error.message.includes('Fechas inválidas') ||
        error.message.includes('válido') ||
        error.message.includes('Suspendido') || 
        error.message.includes('socio')
      ) {
        const cleanMessage = error.message.replace('400: ', '');
        errorCounter.add(1, { method, route, status: '400' });
        return reply.status(400).send({ message: cleanMessage });
      }

      // 2. Capturamos si el recurso no existe en PostgreSQL (404 Not Found)
      if (error.statusCode === 404 || error.message.includes('404') || error.message.includes('inexistente')) {
        const cleanMessage = error.message.replace('404: ', '');
        errorCounter.add(1, { method, route, status: '404' });
        return reply.status(404).send({ error: cleanMessage });
      }

      // 3. Fallo de infraestructura o base de datos (500 Internal Server Error)
      request.log.error(error);
      errorCounter.add(1, { method, route, status: '500' });
      return reply.status(500).send({ error: 'Internal server error' });
    } finally {
      requestDuration.record(Date.now() - start, { method, route });
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
    activeRequestsGauge.add(1);
    try {
      const { id } = request.params;
      
      // Ejecutamos la baja orquestada por el caso de uso
      await this.deleteMedicalCertificateUseCase.execute(id);
      requestCounter.add(1, { method, route, status: '204' });
      // Si fue exitoso, el PRD exige retornar un 204 No Content sin cuerpo
      return reply.status(204).send();

    } catch (error: any) {
      // Manejo de errores controlados por código de estado (statusCode)
      if (error.statusCode === 400 || error.message.includes('válido')) {
        errorCounter.add(1, { method, route, status: '400' });
        return reply.status(400).send({ message: error.message });
      }

      if (error.statusCode === 404 || error.message.includes('Inexistente')) {
        errorCounter.add(1, { method, route, status: '404' });
        return reply.status(404).send({ error: error.message });
      }

      if (error.statusCode === 409 || error.message.includes('integridad')) {
        errorCounter.add(1, { method, route, status: '409' });
        return reply.status(409).send({ error: error.message });
      }

      // Registro del fallo inesperado en los logs de Fastify
      request.log.error(error);
      errorCounter.add(1, { method, route, status: '500' });
      return reply.status(500).send({ error: 'Internal server error' });
    } finally {
      requestDuration.record(Date.now() - start, { method, route });
      activeRequestsGauge.add(-1);
    }
  }
}