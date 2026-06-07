import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../application/NewDisciplineUseCase.js';
import { UpdateDisciplineUseCase } from '../application/UpdateDisciplineUseCase.js';
import { CreateDiscipline, UpdateDiscipline } from '@alentapp/shared';
import { GetDisciplineUseCase } from '../application/GetDisciplineUseCase.js';
import { DeleteDisciplineUseCase } from '../application/DeleteDisciplineUseCase.js';
import { requestCounter, errorCounter, requestDuration, activeRequestsGauge } from '../infrastructure/telemetry.js';

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
        private readonly getDisciplineUseCase: GetDisciplineUseCase,
        private readonly deleteDisciplineUseCase: DeleteDisciplineUseCase,
        private readonly updateDisciplineUseCase: UpdateDisciplineUseCase,
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreateDiscipline }>,
        reply: FastifyReply
    ){
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        activeRequestsGauge.add(1);
        try {
            const discipline = await this.createDisciplineUseCase.execute(request.body);
            requestCounter.add(1, { method, route, status: '201' });
            return reply.status(201).send({ data: discipline });
        } catch (error: any) {
            if (error.message.includes('ID de miembro inválido') ||
                error.message.includes('Razón es un campo requerido y no puede estar vacío.') ||
                error.message.includes('Razón no puede tener más de 40 caracteres.') ||
                error.message.includes('La fecha de inicio es obligatoria') ||
                error.message.includes('La fecha de fin es obligatoria') ||
                error.message.includes('Es suspensión Total debe ser un booleano') ||
                error.message.includes('Required') || //Required es el mensaje por defecto de error que devuelve zod cuando falta un campo requerido
                error.message.includes('requerido') ||
                error.message.includes('obligatori')){ 
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('La fecha de fin debe ser posterior a la fecha de inicio')){
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('El miembro ingresado no existe en el sistema')){
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: 'Error al crear la disciplina' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            activeRequestsGauge.add(-1);
        }
    }

    async findAll(_request: FastifyRequest, reply: FastifyReply){
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        activeRequestsGauge.add(1);
        try {
            const disciplines = await this.getDisciplineUseCase.execute();
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: disciplines });
        } catch (error) {
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: 'Error al obtener las disciplinas' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            activeRequestsGauge.add(-1);
        }
    }
    
    async delete(
        request: FastifyRequest<{Params:{id:string}}>,
        reply: FastifyReply
        ){
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        activeRequestsGauge.add(1);
        try {
            await this.deleteDisciplineUseCase.execute(request.params.id);
            requestCounter.add(1, { method, route, status: '204' });
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('ID de disciplina inválido')) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('La disciplina no existe')) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('La disciplina ya fue eliminada')){
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: 'Error al eliminar la disciplina' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            activeRequestsGauge.add(-1);
        }
    }

    async update(
        request: FastifyRequest<{ Params:{id:string}, Body: UpdateDiscipline }>,
        reply: FastifyReply
    ){
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        activeRequestsGauge.add(1);
        try {
            const discipline = await this.updateDisciplineUseCase.execute(request.params.id, request.body);
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: discipline });
        } catch (error: any) {
            if (error.message.includes('La disciplina no existe')){
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('El miembro ingresado no existe en el sistema')){
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('La fecha de fin debe ser posterior a la fecha de inicio') ||
                error.message.includes('ID de disciplina inválido')){
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('vací') ||
                error.message.includes('Required') || 
                error.message.includes('requerido') ){
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: 'Error al actualizar la disciplina' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            activeRequestsGauge.add(-1);
        }
    }
}