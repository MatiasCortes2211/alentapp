import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateLockerUseCase } from '../application/NewLockerUseCase.js';
import { GetLockersUseCase } from '../application/GetLockersUseCase.js';
import { CreateLockerRequest } from '@alentapp/shared';

export class LockerController {
    constructor(
        private readonly createLockerUseCase: CreateLockerUseCase,
        private readonly getLockersUseCase: GetLockersUseCase,
    ) {}

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const lockers = await this.getLockersUseCase.execute();
            return reply.status(200).send({ data: lockers });
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

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
            if (error.message.includes('La fecha de fin de contrato debe ser mayor')) {
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('conjuntamente')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(400).send({ error: error.message });
        }
    }
}