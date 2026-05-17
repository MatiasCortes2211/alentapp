import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateLockerUseCase } from '../application/NewLockerUseCase.js';
import { CreateLockerRequest } from '@alentapp/shared';

export class LockerController {
    constructor(
        private readonly createLockerUseCase: CreateLockerUseCase
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreateLockerRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const locker = await this.createLockerUseCase.execute(request.body);
            return reply.status(201).send({ data: locker });
        } catch (error: any) {
            if (error.message.includes('Ya existe un casillero activo')) {
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('El socio ingresado no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('solo puede ser asignado si su estado es Disponible')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(400).send({ error: error.message });
        }
    }
}