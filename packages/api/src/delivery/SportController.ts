import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../application/NewSportUseCase.js';
import { GetSportsUseCase } from '../application/GetSportsUseCase.js';
import { UpdateSportUseCase } from '../application/UpdateSportUseCase.js';
import { DeleteSportUseCase } from '../application/DeleteSportUseCase.js';
import { CreateSport, UpdateSport } from '@alentapp/shared';
import { requestCounter, errorCounter, requestDuration, activeRequestsGauge } from '../infrastructure/telemetry.js';

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
        activeRequestsGauge.add(1);
        try {
            const sports = await this.getSportsUseCase.execute();
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: sports });
        } catch (error: any) {
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: error.message });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            activeRequestsGauge.add(-1);
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateSport }>,
        reply: FastifyReply
    ){
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        activeRequestsGauge.add(1);
        try {
            const sport = await this.createSportUseCase.execute(request.body);
            requestCounter.add(1, { method, route, status: '201' });
            return reply.status(201).send({ data: sport });
        } catch (error: any) {
            const zodErrors = [
                "El nombre es obligatorio.",
                "La descripción es obligatoria.",
                "La capacidad máxima es obligatoria.",
                "El precio adicional es obligatorio.",
                "El requisito de certificado médico es obligatorio.",
                "El nombre no puede estar vacío.",
                "La descripción no puede estar vacía.",
                "La capacidad máxima debe ser mayor a 0.",
                "El precio adicional debe ser mayor o igual a $0.",
                "El requisito de certificado médico debe ser un valor booleano válido."
            ];

            if (zodErrors.some(msg => error.message.includes(msg))) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('Ya existe un deporte con ese nombre.')) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: 'Ocurrió un error inesperado. Por favor, intentá de nuevo más tarde.' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            activeRequestsGauge.add(-1);
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }, Body: UpdateSport }>,
        reply: FastifyReply
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        activeRequestsGauge.add(1);
        try {
            const sport = await this.updateSportUseCase.execute(request.params.id, request.body);
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('Unrecognized key')) { // Del .strict() de Zod
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: 'No se pueden modificar campos inmutables tras la creación del deporte.' });
            }
            const zodErrors = [
                "El ID es obligatorio.",
                "La descripción no puede estar vacía.",
                "La capacidad máxima debe ser mayor a 0.",
                "ID inválido."
            ];
            
            if (zodErrors.some(msg => error.message.includes(msg))) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('El deporte no existe.')) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('El deporte ya está eliminado.')) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('La capacidad máxima no puede ser menor a la cantidad de inscriptos activos.')) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: 'Ocurrió un error inesperado. Por favor, intentá de nuevo más tarde.' });
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
            await this.deleteSportUseCase.execute(id);
            requestCounter.add(1, { method, route, status: '204' });
            return reply.status(204).send();
        } catch (error: any) {
            const zodErrors = [
                "El ID es obligatorio.",
                "ID inválido."
            ];
            if (zodErrors.some(msg => error.message.includes(msg))) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('El deporte no existe.')) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('El deporte ya está eliminado.')) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: 'Ocurrió un error inesperado. Por favor, intentá de nuevo más tarde.' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            activeRequestsGauge.add(-1);
        }
    }

}