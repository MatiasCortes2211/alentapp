import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../application/NewDisciplineUseCase.js';
import { UpdateDisciplineUseCase } from '../application/UpdateDisciplineUseCase.js';
import { CreateDiscipline, UpdateDiscipline } from '@alentapp/shared';
import { GetDisciplineUseCase } from '../application/GetDisciplineUseCase.js';
import { DeleteDisciplineUseCase } from '../application/DeleteDisciplineUseCase.js';
import { recordRequest, recordError, recordDuration, activeRequestsGauge } from '../infrastructure/telemetry.js';

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
        let statusCode = 201;
        activeRequestsGauge.add(1);
        try {
            const discipline = await this.createDisciplineUseCase.execute(request.body);
            return reply.status(statusCode).send({ data: discipline });
        } catch (error: any) {
            statusCode = 500;
            if (error.message.includes('ID de miembro inválido') ||
                error.message.includes('Razón es un campo requerido') ||
                error.message.includes('Razón no puede tener más de 40 caracteres.') ||
                error.message.includes('La fecha de inicio es obligatoria') ||
                error.message.includes('La fecha de fin es obligatoria') ||
                error.message.includes('Es suspensión Total debe ser un booleano') ||
                error.message.includes('Required') ||
                error.message.includes('requerido') ||
                error.message.includes('obligatori') ||
                error.message.includes('La fecha de fin debe ser posterior a la fecha de inicio')){ 
                statusCode = 400;
            } else if (error.message.includes('El miembro ingresado no existe en el sistema')){
                statusCode = 404;
            }
            recordError(route, method, statusCode);
            return reply.status(statusCode).send({ error: error.message || 'Error al crear la disciplina' });
        } finally {
            recordRequest(route, method, statusCode);
            recordDuration(Date.now() - start, route, method);
            activeRequestsGauge.add(-1);
        }
    }

    async findAll(_request: FastifyRequest, reply: FastifyReply){
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        let statusCode = 200;
        activeRequestsGauge.add(1);
        try {
            const disciplines = await this.getDisciplineUseCase.execute();
            return reply.status(statusCode).send({ data: disciplines });
        } catch (error) {
            statusCode = 500;
            recordError(route, method, statusCode);
            return reply.status(statusCode).send({ error: 'Error al obtener las disciplinas' });
        } finally {
            recordRequest(route, method, statusCode);
            recordDuration(Date.now() - start, route, method);
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
        let statusCode = 204;
        activeRequestsGauge.add(1);
        try {
            await this.deleteDisciplineUseCase.execute(request.params.id);
            return reply.status(statusCode).send();
        } catch (error: any) {
            statusCode = 500;
            if (error.message.includes('ID de disciplina inválido')) {
                statusCode = 400;
            } else if (error.message.includes('La disciplina no existe')) {
                statusCode = 404;
            } else if (error.message.includes('La disciplina ya fue eliminada')){
                statusCode = 409;
            }
            recordError(route, method, statusCode);
            return reply.status(statusCode).send({ error: error.message || 'Error al eliminar la disciplina' });
        } finally {
            recordRequest(route, method, statusCode);
            recordDuration(Date.now() - start, route, method);
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
        let statusCode = 200;
        activeRequestsGauge.add(1);
        try {
            const discipline = await this.updateDisciplineUseCase.execute(request.params.id, request.body);
            return reply.status(statusCode).send({ data: discipline });
        } catch (error: any) {
            statusCode = 500;
            if (error.message.includes('La disciplina no existe') || error.message.includes('El miembro ingresado no existe')){
                statusCode = 404;
            } else if (error.message.includes('La fecha de fin debe ser posterior a la fecha de inicio') ||
                       error.message.includes('ID de disciplina inválido') ||
                       error.message.includes('vací') ||
                       error.message.includes('Required') || 
                       error.message.includes('requerido')){
                statusCode = 400;
            }
            recordError(route, method, statusCode);
            return reply.status(statusCode).send({ error: error.message || 'Error al actualizar la disciplina' });
        } finally {
            recordRequest(route, method, statusCode);
            recordDuration(Date.now() - start, route, method);
            activeRequestsGauge.add(-1);
        }
    }
}