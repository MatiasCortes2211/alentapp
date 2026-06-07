import { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../application/NewPaymentUseCase.js';
import { CreatePaymentRequest, UpdatePaymentRequest} from '@alentapp/shared';
import { GetPaymentsUseCase } from '../application/GetPaymentsUseCase.js';
import { DeletePaymentUseCase } from '../application/DeletePaymentUseCase.js';
import { UpdatePaymentUseCase } from '../application/UpdatePaymentUseCase.js';
import { requestCounter, errorCounter, requestDuration, activeRequestsGauge } from '../infrastructure/telemetry.js';

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
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        activeRequestsGauge.add(1);
        try {
            request.log.info('Iniciando registro de nuevo pago');
            
            const pago = await this.createPaymentUseCase.execute(request.body);
            requestCounter.add(1, { method, route, status: '201' });
            return reply.status(201).send({ data: pago });
            
        } catch (error: any) {

            if (error.message.includes('no existe en el sistema')) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }

            if (error.message.includes('Ya existe un pago activo')) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message });
            }

            if (
                error.message.includes('mayor a cero') ||         
                error.message.includes('entre 1 y 12') ||          
                error.message.includes('no puede ser anterior a hoy') || 
                error.message.includes('UUID válido') ||          
                error.message.includes('mayor o igual a 2024') ||
                error.message.includes('requerida') ||
                error.message.includes('obligatori') ||
                error.message.includes('socio suspendido')
                
            ) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }

            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            activeRequestsGauge.add(-1);
        }
    }
    async getAll( 
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        activeRequestsGauge.add(1);
        try {
            request.log.info('Obteniendo todos los pagos');

            const pagos = await this.getPaymentsUseCase.execute();
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: pagos });

        } catch (error: any) {
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            activeRequestsGauge.add(-1);
        }
    }

    async delete( 
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        activeRequestsGauge.add(1);
        try {
            request.log.info('Eliminando pago');

            const { id } = request.params;
            await this.deletePaymentUseCase.execute(id);
            requestCounter.add(1, { method, route, status: '204' });
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('no existe en el sistema')) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('ya fue eliminado')) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('El formato del ID es inválido')) {
            errorCounter.add(1, { method, route, status: '400' });
            return reply.status(400).send({ error: error.message });
            }

            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
            
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            activeRequestsGauge.add(-1);
        }
        
    }

       async update( 
        request: FastifyRequest<{ Params: { id: string }, Body: UpdatePaymentRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        activeRequestsGauge.add(1);
        try {
            request.log.info('Actualizando estado de pago');

            const { id } = request.params;
            const pago = await this.updatePaymentUseCase.execute(id, request.body);
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: pago });

        } catch (error: any) {

            if (error.message.includes('no existe en el sistema')) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }

            if (error.message.includes('ya se encuentra en estado') ||
                error.message.includes('Un pago no puede ser modificado si se encuentra eliminado')) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message });
            }
            
            if (error.message.includes('El estado debe ser PAID o CANCELED') ||
                error.message.includes('El formato del ID es inválido') ||
                error.message.includes('socio suspendido')) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }

            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            activeRequestsGauge.add(-1);
        }
    }
}