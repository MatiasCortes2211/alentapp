import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentController } from './PaymentController.js';

describe('PaymentController', () => {
    const mockCreateUseCase = { execute: vi.fn() };
    const mockGetUseCase = { execute: vi.fn() };
    const mockDeleteUseCase = { execute: vi.fn() };
    const mockUpdateUseCase = { execute: vi.fn() };

    const controller = new PaymentController(
        mockCreateUseCase as any,
        mockGetUseCase as any,
        mockDeleteUseCase as any,
        mockUpdateUseCase as any
    );

    const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('create', () => {

    const mockRequest = {
        log: { info: vi.fn() },
        body: {
            amount: 5000,
            month: 6,
            year: 2026,
            due_date: '2026-06-30',
            member_id: '123e4567-e89b-12d3-a456-426614174000'
        },
        params: { id: '123e4567-e89b-12d3-a456-426614174000' }
    };

        it('debe devolver status 201 y los datos si la creación es exitosa', async () => {
            const mockPago = { id: '123e4567-e89b-12d3-a456-426614174001', ...mockRequest.body };
            mockCreateUseCase.execute.mockResolvedValueOnce(mockPago);

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(201);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockPago });
        });

        it('debe devolver status 404 si el miembro no existe', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('El miembro ingresado no existe en el sistema'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El miembro ingresado no existe en el sistema' });
        });

        it('debe devolver status 409 si ya existe un pago activo para ese mes y año', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Ya existe un pago activo para este socio en el mismo mes y año'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(409);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Ya existe un pago activo para este socio en el mismo mes y año' });
        });

        it('debe devolver status 400 si el monto es inválido', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('El monto debe ser mayor a cero'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El monto debe ser mayor a cero' });
        });

        it('debe devolver status 400 si la fecha de vencimiento es anterior a hoy', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('La fecha de vencimiento no puede ser anterior a hoy'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'La fecha de vencimiento no puede ser anterior a hoy' });
        });

        it('debe devolver status 500 para cualquier otro error', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Error de conexion de Prisma...'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' });
        });
    });

    describe('update', () => {

    const mockUpdateRequest = {
            log: { info: vi.fn() },
            params: { id: '123e4567-e89b-12d3-a456-426614174001' },
            body: { status: 'PAID' }
        };

        it('debe devolver status 200 y el pago actualizado si la actualización es exitosa', async () => {
            const mockPago = { 
                id: '123e4567-e89b-12d3-a456-426614174001', 
                status: 'PAID',
                payment_date: new Date().toISOString()
            };
            mockUpdateUseCase.execute.mockResolvedValueOnce(mockPago);

            await controller.update(mockUpdateRequest as any, mockReply as any);

            expect(mockUpdateUseCase.execute).toHaveBeenCalledWith(
                mockUpdateRequest.params.id,
                mockUpdateRequest.body
            );
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockPago });
        });

        it('debe devolver status 404 si el pago no existe', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('El pago ingresado no existe en el sistema'));

            await controller.update(mockUpdateRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El pago ingresado no existe en el sistema' });
        });

        it('debe devolver status 409 si el pago ya está en estado PAID o CANCELED', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('El pago ya se encuentra en estado PAID y no puede ser modificado'));

            await controller.update(mockUpdateRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(409);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El pago ya se encuentra en estado PAID y no puede ser modificado' });
        });

        it('debe devolver status 409 si el pago está eliminado', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('Un pago no puede ser modificado si se encuentra eliminado'));

            await controller.update(mockUpdateRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(409);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Un pago no puede ser modificado si se encuentra eliminado' });
        });

        it('debe devolver status 400 si el formato del ID es inválido', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('El formato del ID es inválido'));

            await controller.update(mockUpdateRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El formato del ID es inválido' });
        });

        it('debe devolver status 500 para cualquier otro error', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('Error de conexion de Prisma...'));

            await controller.update(mockUpdateRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' });
        });
    });

    describe('delete', () => {

        const mockDeleteRequest = {
            log: { info: vi.fn() },
            params: { id: '123e4567-e89b-12d3-a456-426614174001' },
            body: {}
        };

        it('debe devolver status 204 si el pago se elimina exitosamente', async () => {
            mockDeleteUseCase.execute.mockResolvedValueOnce(undefined);

            await controller.delete(mockDeleteRequest as any, mockReply as any);

            expect(mockDeleteUseCase.execute).toHaveBeenCalledWith(mockDeleteRequest.params.id);
            expect(mockReply.status).toHaveBeenCalledWith(204);
            expect(mockReply.send).toHaveBeenCalledWith();
        });

        it('debe devolver status 404 si el pago no existe', async () => {
            mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('El pago ingresado no existe en el sistema'));

            await controller.delete(mockDeleteRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El pago ingresado no existe en el sistema' });
        });

        it('debe devolver status 409 si el pago ya fue eliminado', async () => {
            mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('El pago ya fue eliminado'));

            await controller.delete(mockDeleteRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(409);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El pago ya fue eliminado' });
        });

        it('debe devolver status 400 si el formato del ID es inválido', async () => {
            mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('El formato del ID es inválido'));

            await controller.delete(mockDeleteRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El formato del ID es inválido' });
        });

        it('debe devolver status 500 para cualquier otro error', async () => {
            mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('Error de conexion de Prisma...'));

            await controller.delete(mockDeleteRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' });
        });
    });

});