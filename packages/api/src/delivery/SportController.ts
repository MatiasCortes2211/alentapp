import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../application/NewSportUseCase.js';
import { GetSportsUseCase } from '../application/GetSportsUseCase.js';
import { CreateSport } from '@alentapp/shared';

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly getSportsUseCase: GetSportsUseCase
    ) {}

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const sports = await this.getSportsUseCase.execute();
            return reply.status(200).send({ data: sports });
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

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
}