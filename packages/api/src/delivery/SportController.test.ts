import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SportController } from './SportController.js';

describe('SportController', () => {
    const mockCreateUseCase = { execute: vi.fn() };
    const mockGetUseCase = { execute: vi.fn() };
    const mockUpdateUseCase = { execute: vi.fn() };
    const mockDeleteUseCase = { execute: vi.fn() };

    const controller = new SportController(
        mockCreateUseCase as any,
        mockUpdateUseCase as any,
        mockGetUseCase as any,
        mockDeleteUseCase as any
    );

    const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn()
    };

    const mockRequest = {
        params: { id: 'uuid-valido' },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('delete', () => {
        it('debe devolver status 204 si la eliminación es exitosa', async () => {
            mockDeleteUseCase.execute.mockResolvedValueOnce(undefined);

            await controller.delete(mockRequest as any, mockReply as any);

            expect(mockDeleteUseCase.execute).toHaveBeenCalledWith('uuid-valido');
            expect(mockReply.status).toHaveBeenCalledWith(204);
            expect(mockReply.send).toHaveBeenCalledWith();
        });

        it('debe devolver status 400 si el ID es obligatorio (falta el parámetro)', async () => {
            mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('El ID es obligatorio.'));

            await controller.delete(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El ID es obligatorio.' });
        });

        it('debe devolver status 400 si el ID es inválido', async () => {
            mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('ID inválido.'));

            await controller.delete(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'ID inválido.' });
        });

        it('debe devolver status 404 si el deporte no existe', async () => {
            mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('El deporte no existe.'));

            await controller.delete(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El deporte no existe.' });
        });

        it('debe devolver status 409 si el deporte ya está eliminado', async () => {    
            mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('El deporte ya está eliminado.'));

            await controller.delete(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(409);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El deporte ya está eliminado.' });
        });

        it('debe devolver status 500 para cualquier otro error', async () => {
            mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('Error inesperado'));

            await controller.delete(mockRequest as any, mockReply as any);
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Ocurrió un error inesperado. Por favor, intentá de nuevo más tarde.' });
        });
    });
});