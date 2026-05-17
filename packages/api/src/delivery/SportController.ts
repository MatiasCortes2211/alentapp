import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../application/NewSportUseCase.js';
import { UpdateSportUseCase } from '../application/UpdateSportUseCase.js';
import { CreateSport, UpdateSport } from '@alentapp/shared';

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly updateSportUseCase: UpdateSportUseCase
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreateSport }>,
        reply: FastifyReply
    ){
        try {
            const sport = await this.createSportUseCase.execute(request.body);
            return reply.status(201).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('Required') || error.message.includes('requerido')) { //Required es el mensaje por defecto de error que devuelve zod cuando falta un campo requerido
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('No pueden existir dos instancias de Sport con el mismo nombre.')) {
                return reply.status(409).send({ error: error.message });
   
            }
            if (error.message.includes('max_capacity debe ser mayor a 0.')) {
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('additional_price debe ser mayor o igual a 0.')) {
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('requires_medical_certificate debe ser un valor booleano válido.')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Internal server error' });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }, Body: UpdateSport }>,
        reply: FastifyReply
    ) {
        try {
            const sport = await this.updateSportUseCase.execute(request.params.id, request.body);
            return reply.status(200).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('Required') || error.message.includes('requerido')) {
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('El deporte no existe.')) {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('max_capacity no puede ser menor a la cantidad de inscriptos activos.')) {
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('description no puede estar vacío.')) {
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('max_capacity debe ser mayor a 0.')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Internal server error' });
        }
    }
}