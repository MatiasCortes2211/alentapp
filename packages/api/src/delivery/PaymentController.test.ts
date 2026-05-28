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

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('create', () => {
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
});