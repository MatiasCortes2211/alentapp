import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateLockerUseCase } from '../application/NewLockerUseCase.js';
import { GetLockersUseCase } from '../application/GetLockersUseCase.js';
import { UpdateLockerUseCase } from '../application/UpdateLockerUseCase.js';
import { DeleteLockerUseCase } from '../application/DeleteLockerUseCase.js';
import { CreateLockerRequest, UpdateLockerRequest } from '@alentapp/shared';
import { requestCounter, errorCounter, requestDuration, activeRequestsGauge } from '../infrastructure/telemetry.js';

export class LockerController {
    constructor(
        private readonly createLockerUseCase: CreateLockerUseCase,
        private readonly getLockersUseCase: GetLockersUseCase,
        private readonly updateLockerUseCase: UpdateLockerUseCase,
        private readonly deleteLockerUseCase: DeleteLockerUseCase,
    ) {}

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        activeRequestsGauge.add(1);
        try {
            const lockers = await this.getLockersUseCase.execute();
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: lockers });
        } catch (error: any) {
            console.error('[getAll Lockers Error]:', error);
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: 'Ocurrió un error interno en el servidor.' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            activeRequestsGauge.add(-1);
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateLockerRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        activeRequestsGauge.add(1);
        try {
            const locker = await this.createLockerUseCase.execute(request.body);
            requestCounter.add(1, { method, route, status: '201' });
            return reply.status(201).send({ data: locker });
        } catch (error: any) {
            if (error.message.includes('Ya existe un casillero activo')) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('El socio ingresado no existe')) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('solo puede ser asignado si su estado es Disponible')) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('La fecha de fin de contrato debe ser mayor')) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('conjuntamente')) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('límite máximo de 100 casilleros')) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('socio suspendido')) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            errorCounter.add(1, { method, route, status: '400' });
            return reply.status(400).send({ error: error.message });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            activeRequestsGauge.add(-1);
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }, Body: UpdateLockerRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        activeRequestsGauge.add(1);
        try {
            const locker = await this.updateLockerUseCase.execute(request.params.id, request.body);
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: locker });
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('Ya existe un casillero')) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('socio suspendido')) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            errorCounter.add(1, { method, route, status: '400' });
            return reply.status(400).send({ error: error.message });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            activeRequestsGauge.add(-1);
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        activeRequestsGauge.add(1);
        try {
            await this.deleteLockerUseCase.execute(request.params.id);
            requestCounter.add(1, { method, route, status: '204' });
            return reply.status(204).send(); 
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('ya fue eliminado previamente')) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('formato del ID es inválido')) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            console.error('[delete Lockers Error]:', error);
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: 'Ocurrió un error interno en el servidor.' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            activeRequestsGauge.add(-1);
        }
    }
}