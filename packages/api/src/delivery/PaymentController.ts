import { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../application/NewPaymentUseCase.js';
import { CreatePaymentRequest, UpdatePaymentRequest} from '@alentapp/shared';
import { GetPaymentsUseCase } from '../application/GetPaymentsUseCase.js';
import { DeletePaymentUseCase } from '../application/DeletePaymentUseCase.js';
import { UpdatePaymentUseCase } from '../application/UpdatePaymentUseCase.js';
import { recordRequest, recordError, recordDuration, activeRequestsGauge } from '../infrastructure/telemetry.js';

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
        let statusCode = 201;
        activeRequestsGauge.add(1);
        try {
            request.log.info('Iniciando registro de nuevo pago');
            const pago = await this.createPaymentUseCase.execute(request.body);
            return reply.status(statusCode).send({ data: pago });
        } catch (error: any) {
            statusCode = 500;
            if (error.message.includes('no existe en el sistema')) statusCode = 404;
            else if (error.message.includes('Ya existe un pago activo')) statusCode = 409;
            else if (error.message.includes('mayor a cero') || error.message.includes('entre 1 y 12') || error.message.includes('no puede ser anterior a hoy') || error.message.includes('UUID válido') || error.message.includes('mayor o igual a 2024') || error.message.includes('requerida') || error.message.includes('obligatori') || error.message.includes('socio suspendido')) {
                statusCode = 400;
            }
            recordError(route, method, statusCode);
            return reply.status(statusCode).send({ error: error.message || "Error interno, reintente más tarde" });
        } finally {
            recordRequest(route, method, statusCode);
            recordDuration(Date.now() - start, route, method);
            activeRequestsGauge.add(-1);
        }
    }

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        let statusCode = 200;
        activeRequestsGauge.add(1);
        try {
            request.log.info('Obteniendo todos los pagos');
            const pagos = await this.getPaymentsUseCase.execute();
            return reply.status(statusCode).send({ data: pagos });
        } catch (error: any) {
            statusCode = 500;
            recordError(route, method, statusCode);
            return reply.status(statusCode).send({ error: "Error interno, reintente más tarde" });
        } finally {
            recordRequest(route, method, statusCode);
            recordDuration(Date.now() - start, route, method);
            activeRequestsGauge.add(-1);
        }
    }

    async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        let statusCode = 204;
        activeRequestsGauge.add(1);
        try {
            request.log.info('Eliminando pago');
            await this.deletePaymentUseCase.execute(request.params.id);
            return reply.status(statusCode).send();
        } catch (error: any) {
            statusCode = 500;
            if (error.message.includes('no existe en el sistema')) statusCode = 404;
            else if (error.message.includes('ya fue eliminado')) statusCode = 409;
            else if (error.message.includes('El formato del ID es inválido')) statusCode = 400;
            
            recordError(route, method, statusCode);
            return reply.status(statusCode).send({ error: error.message || "Error interno, reintente más tarde" });
        } finally {
            recordRequest(route, method, statusCode);
            recordDuration(Date.now() - start, route, method);
            activeRequestsGauge.add(-1);
        }
    }

    async update(request: FastifyRequest<{ Params: { id: string }, Body: UpdatePaymentRequest }>, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        let statusCode = 200;
        activeRequestsGauge.add(1);
        try {
            request.log.info('Actualizando estado de pago');
            const pago = await this.updatePaymentUseCase.execute(request.params.id, request.body);
            return reply.status(statusCode).send({ data: pago });
        } catch (error: any) {
            statusCode = 500;
            if (error.message.includes('no existe en el sistema')) statusCode = 404;
            else if (error.message.includes('ya se encuentra en estado') || error.message.includes('Un pago no puede ser modificado si se encuentra eliminado')) statusCode = 409;
            else if (error.message.includes('El estado debe ser PAID o CANCELED') || error.message.includes('El formato del ID es inválido') || error.message.includes('socio suspendido')) statusCode = 400;

            recordError(route, method, statusCode);
            return reply.status(statusCode).send({ error: error.message || "Error interno, reintente más tarde" });
        } finally {
            recordRequest(route, method, statusCode);
            recordDuration(Date.now() - start, route, method);
            activeRequestsGauge.add(-1);
        }
    }
}