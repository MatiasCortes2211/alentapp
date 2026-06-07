import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateLockerUseCase } from '../application/NewLockerUseCase.js';
import { GetLockersUseCase } from '../application/GetLockersUseCase.js';
import { UpdateLockerUseCase } from '../application/UpdateLockerUseCase.js';
import { DeleteLockerUseCase } from '../application/DeleteLockerUseCase.js';
import { CreateLockerRequest, UpdateLockerRequest } from '@alentapp/shared';
import { recordRequest, recordError, recordDuration, activeRequestsGauge } from '../infrastructure/telemetry.js';

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
        let statusCode = 200;
        activeRequestsGauge.add(1);
        try {
            const lockers = await this.getLockersUseCase.execute();
            return reply.status(statusCode).send({ data: lockers });
        } catch (error: any) {
            console.error('[getAll Lockers Error]:', error);
            statusCode = 500;
            recordError(route, method, statusCode);
            return reply.status(statusCode).send({ error: 'Ocurrió un error interno en el servidor.' });
        } finally {
            recordRequest(route, method, statusCode);
            recordDuration(Date.now() - start, route, method);
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
        let statusCode = 201;
        activeRequestsGauge.add(1);
        try {
            const locker = await this.createLockerUseCase.execute(request.body);
            return reply.status(statusCode).send({ data: locker });
        } catch (error: any) {
            statusCode = 400;
            if (error.message.includes('Ya existe un casillero activo')) statusCode = 409;
            else if (error.message.includes('El socio ingresado no existe')) statusCode = 404;
            
            recordError(route, method, statusCode);
            return reply.status(statusCode).send({ error: error.message });
        } finally {
            recordRequest(route, method, statusCode);
            recordDuration(Date.now() - start, route, method);
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
        let statusCode = 200;
        activeRequestsGauge.add(1);
        try {
            const locker = await this.updateLockerUseCase.execute(request.params.id, request.body);
            return reply.status(statusCode).send({ data: locker });
        } catch (error: any) {
            statusCode = 400;
            if (error.message.includes('no existe')) statusCode = 404;
            else if (error.message.includes('Ya existe un casillero')) statusCode = 409;
            
            recordError(route, method, statusCode);
            return reply.status(statusCode).send({ error: error.message });
        } finally {
            recordRequest(route, method, statusCode);
            recordDuration(Date.now() - start, route, method);
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
        let statusCode = 204;
        activeRequestsGauge.add(1);
        try {
            await this.deleteLockerUseCase.execute(request.params.id);
            return reply.status(statusCode).send(); 
        } catch (error: any) {
            statusCode = 500;
            if (error.message.includes('no existe')) statusCode = 404;
            else if (error.message.includes('ya fue eliminado previamente')) statusCode = 409;
            else if (error.message.includes('formato del ID es inválido')) statusCode = 400;
            
            recordError(route, method, statusCode);
            return reply.status(statusCode).send({ error: error.message || 'Ocurrió un error interno en el servidor.' });
        } finally {
            recordRequest(route, method, statusCode);
            recordDuration(Date.now() - start, route, method);
            activeRequestsGauge.add(-1);
        }
    }
}