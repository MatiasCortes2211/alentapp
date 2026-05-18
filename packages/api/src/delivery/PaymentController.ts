import { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../application/NewPaymentUseCase.js';
import { CreatePaymentRequest, UpdatePaymentRequest} from '@alentapp/shared';
import { GetPaymentsUseCase } from '../application/GetPaymentsUseCase.js';
import { DeletePaymentUseCase } from '../application/DeletePaymentUseCase.js';
import { UpdatePaymentUseCase } from '../application/UpdatePaymentUseCase.js';

export class PaymentController {
    constructor(
        private readonly createPaymentUseCase: CreatePaymentUseCase,
        private readonly getPaymentsUseCase: GetPaymentsUseCase,
        private readonly deletePaymentUseCase: DeletePaymentUseCase,
        private readonly updatePaymentUseCase: UpdatePaymentUseCase
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
                error.message.includes('UUID válido') ||          
                error.message.includes('mayor o igual a 2024')  
                
            ) {
                return reply.status(400).send({ error: error.message });
            }

            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }
    async getAll( 
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        try {
            request.log.info('Obteniendo todos los pagos');

            const pagos = await this.getPaymentsUseCase.execute();

            return reply.status(200).send({ data: pagos });

        } catch (error: any) {
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }

    async delete( 
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            request.log.info('Eliminando pago');

            const { id } = request.params;
            await this.deletePaymentUseCase.execute(id);
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('no existe en el sistema')) {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('ya fue eliminado')) {
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('El formato del ID es inválido')) {
            return reply.status(400).send({ error: error.message });
            }

            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
            
        }
        
    }

       async update( 
        request: FastifyRequest<{ Params: { id: string }, Body: UpdatePaymentRequest }>,
        reply: FastifyReply,
    ) {
        try {
            request.log.info('Actualizando estado de pago');

            const { id } = request.params;
            const pago = await this.updatePaymentUseCase.execute(id, request.body);

            return reply.status(200).send({ data: pago });

        } catch (error: any) {

            if (error.message.includes('no existe en el sistema')) {
                return reply.status(404).send({ error: error.message });
            }

            if (error.message.includes('ya se encuentra en estado')) {
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('El estado debe ser PAID o CANCELED') ||
                error.message.includes('El formato del ID es inválido')) {
                return reply.status(400).send({ error: error.message });
            }

            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }
}