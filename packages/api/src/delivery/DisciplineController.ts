import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../application/NewDisciplineUseCase.js';
import { CreateDiscipline } from '@alentapp/shared';
import { DeleteDisciplineUseCase } from '../application/DeleteDisciplineUseCase.js';

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
        private readonly deleteDisciplineUseCase: DeleteDisciplineUseCase,
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreateDiscipline }>,
        reply: FastifyReply
    ){
        try {
            const discipline = await this.createDisciplineUseCase.execute(request.body);
            return reply.status(201).send({ data: discipline });
        } catch (error: any) {
            if (error.message.includes('Required') || error.message.includes('requerido')) { //Required es el mensaje por defecto de error que devuelve zod cuando falta un campo requerido
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('La fecha de fin debe ser posterior a la fecha de inicio')){
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('El miembro ingresado no existe en el sistema')){
                return reply.status(404).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error al crear la disciplina' });
        }
    }
    
    async delete(
        request: FastifyRequest<{Params:{id:string}}>,
        reply: FastifyReply
        ){
        try {
            await this.deleteDisciplineUseCase.execute(request.params.id);
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('La disciplina no existe')){
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('La disciplina ya fue eliminada')){
                return reply.status(409).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error al eliminar la disciplina' });
        }
    }
}