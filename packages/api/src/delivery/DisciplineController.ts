import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../application/NewDisciplineUseCase.js';
import { CreateDiscipline } from '@alentapp/shared';

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
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
}