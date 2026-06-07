import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateMemberUseCase } from '../application/NewMemberUseCase.js';
import { GetMembersUseCase } from '../application/GetMembersUseCase.js';
import { UpdateMemberUseCase } from '../application/UpdateMemberUseCase.js';
import { DeleteMemberUseCase } from '../application/DeleteMemberUseCase.js';
import { CreateMemberRequest, UpdateMemberRequest } from '@alentapp/shared';
import { recordRequest, recordError, recordDuration, activeRequestsGauge } from '../infrastructure/telemetry.js';

export class MemberController {
    constructor(
        private readonly createMemberUseCase: CreateMemberUseCase,
        private readonly getMembersUseCase: GetMembersUseCase,
        private readonly updateMemberUseCase: UpdateMemberUseCase,
        private readonly deleteMemberUseCase: DeleteMemberUseCase,
    ) {}

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        let statusCode = 200;
        activeRequestsGauge.add(1);
        try {
            const socios = await this.getMembersUseCase.execute();
            return reply.status(statusCode).send({ data: socios });
        } catch (error: any) {
            statusCode = 500;
            recordError(route, method, statusCode);
            return reply.status(statusCode).send({ error: error.message });
        } finally {
            recordRequest(route, method, statusCode);
            recordDuration(Date.now() - start, route, method);
            activeRequestsGauge.add(-1);
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateMemberRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        let statusCode = 201;
        activeRequestsGauge.add(1);
        try {
            request.log.info('Alguien pegó al endpoint de ping');
            const socio = await this.createMemberUseCase.execute(request.body);
            return reply.status(statusCode).send({ data: socio });
        } catch (error: any) {
            statusCode = 500;
            if (error.message.includes('Ya existe un miembro con ese DNI')) statusCode = 409;
            else if (error.message.includes('inválido')) statusCode = 400;

            recordError(route, method, statusCode);
            return reply.status(statusCode).send({ error: error.message || "Error interno, reintente más tarde" });
        } finally {
            recordRequest(route, method, statusCode);
            recordDuration(Date.now() - start, route, method);
            activeRequestsGauge.add(-1);
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateMemberRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        let statusCode = 200;
        activeRequestsGauge.add(1);
        try {
            const { id } = request.params;
            const socio = await this.updateMemberUseCase.execute(id, request.body);
            return reply.status(statusCode).send({ data: socio });
        } catch (error: any) {
            statusCode = 500;
            if (error.message.includes('Ya existe un miembro con ese DNI')) statusCode = 409;
            else if (error.message.includes('inválido') || error.message.includes('no existe')) statusCode = 400;

            recordError(route, method, statusCode);
            return reply.status(statusCode).send({ error: error.message || "Error interno, reintente más tarde" });
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
            const { id } = request.params;
            await this.deleteMemberUseCase.execute(id);
            return reply.status(statusCode).send();
        } catch (error: any) {
            statusCode = 400;
            recordError(route, method, statusCode);
            return reply.status(statusCode).send({ error: error.message });
        } finally {
            recordRequest(route, method, statusCode);
            recordDuration(Date.now() - start, route, method);
            activeRequestsGauge.add(-1);
        }
    }
}