import { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../application/NewPaymentUseCase.js';
import { CreatePaymentRequest } from '@alentapp/shared';

export class PaymentController {
    constructor(
        private readonly createPaymentUseCase: CreatePaymentUseCase
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreatePaymentRequest }>,
        reply: FastifyReply,
    ) {
        try {
            request.log.info('Iniciando registro de nuevo pago');
            
            const pago = await this.createPaymentUseCase.execute(request.body);

            return reply.status(201).send({ data: pago });
            
        } catch (error: any) {

            if (error.message.includes('no existe en el sistema')) {
                return reply.status(404).send({ error: error.message });
            }

            if (error.message.includes('Ya existe un pago activo')) {
                return reply.status(409).send({ error: error.message });
            }

            if (
                error.message.includes('mayor a cero') || 
                error.message.includes('entre 1 y 12') || 
                error.message.includes('no puede ser anterior a hoy') ||
                error.message.includes('es requerido')
            ) {
                return reply.status(400).send({ error: error.message });
            }

            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }
}