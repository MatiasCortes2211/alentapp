import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../application/NewSportUseCase.js';
import { GetSportsUseCase } from '../application/GetSportsUseCase.js';
import { UpdateSportUseCase } from '../application/UpdateSportUseCase.js';
import { DeleteSportUseCase } from '../application/DeleteSportUseCase.js';
import { CreateSport, UpdateSport } from '@alentapp/shared';
import { recordRequest, recordError, recordDuration, activeRequestsGauge } from '../infrastructure/telemetry.js';

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly updateSportUseCase: UpdateSportUseCase,
        private readonly getSportsUseCase: GetSportsUseCase,
        private readonly deleteSportUseCase: DeleteSportUseCase,
    ) {}

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        let statusCode = 200;
        activeRequestsGauge.add(1);
        try {
            const sports = await this.getSportsUseCase.execute();
            return reply.status(statusCode).send({ data: sports });
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

    async create(request: FastifyRequest<{ Body: CreateSport }>, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        let statusCode = 201;
        activeRequestsGauge.add(1);
        try {
            const sport = await this.createSportUseCase.execute(request.body);
            return reply.status(statusCode).send({ data: sport });
        } catch (error: any) {
            statusCode = 500;
            const zodErrors = [
                "El nombre es obligatorio.", "La descripción es obligatoria.", "La capacidad máxima es obligatoria.",
                "El precio adicional es obligatorio.", "El requisito de certificado médico es obligatorio.",
                "El nombre no puede estar vacío.", "La descripción no puede estar vacía.",
                "La capacidad máxima debe ser mayor a 0.", "El precio adicional debe ser mayor o igual a $0.",
                "El requisito de certificado médico debe ser un valor booleano válido."
            ];

            if (zodErrors.some(msg => error.message.includes(msg))) statusCode = 400;
            else if (error.message.includes('Ya existe un deporte con ese nombre.')) statusCode = 409;

            recordError(route, method, statusCode);
            return reply.status(statusCode).send({ error: error.message || 'Ocurrió un error inesperado.' });
        } finally {
            recordRequest(route, method, statusCode);
            recordDuration(Date.now() - start, route, method);
            activeRequestsGauge.add(-1);
        }
    }

    async update(request: FastifyRequest<{ Params: { id: string }, Body: UpdateSport }>, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        let statusCode = 200;
        activeRequestsGauge.add(1);
        try {
            const sport = await this.updateSportUseCase.execute(request.params.id, request.body);
            return reply.status(statusCode).send({ data: sport });
        } catch (error: any) {
            statusCode = 500;
            if (error.message.includes('Unrecognized key')) statusCode = 400;
            else if (["El ID es obligatorio.", "La descripción no puede estar vacía.", "La capacidad máxima debe ser mayor a 0.", "ID inválido."].some(msg => error.message.includes(msg))) statusCode = 400;
            else if (error.message.includes('El deporte no existe.')) statusCode = 404;
            else if (error.message.includes('El deporte ya está eliminado.') || error.message.includes('La capacidad máxima no puede ser menor')) statusCode = 409;

            recordError(route, method, statusCode);
            return reply.status(statusCode).send({ error: error.message || 'Ocurrió un error inesperado.' });
        } finally {
            recordRequest(route, method, statusCode);
            recordDuration(Date.now() - start, route, method);
            activeRequestsGauge.add(-1);
        }
    }

    async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        let statusCode = 204;
        activeRequestsGauge.add(1);
        try {
            await this.deleteSportUseCase.execute(request.params.id);
            return reply.status(statusCode).send();
        } catch (error: any) {
            statusCode = 500;
            if (["El ID es obligatorio.", "ID inválido."].some(msg => error.message.includes(msg))) statusCode = 400;
            else if (error.message.includes('El deporte no existe.')) statusCode = 404;
            else if (error.message.includes('El deporte ya está eliminado.')) statusCode = 409;

            recordError(route, method, statusCode);
            return reply.status(statusCode).send({ error: error.message || 'Ocurrió un error inesperado.' });
        } finally {
            recordRequest(route, method, statusCode);
            recordDuration(Date.now() - start, route, method);
            activeRequestsGauge.add(-1);
        }
    }
}