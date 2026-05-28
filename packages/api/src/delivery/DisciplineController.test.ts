import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisciplineController } from './DisciplineController.js';

describe('DisciplineController', () => {
    const mockCreateUseCase = { execute: vi.fn() };
    const mockGetUseCase = { execute: vi.fn() };
    const mockDeleteUseCase = { execute: vi.fn() };
    const mockUpdateUseCase = { execute: vi.fn() };


    const controller = new DisciplineController(
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
        params: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('delete', () => {
        it('debe devolver status 204 si la eliminación es exitosa', async () => {
            mockDeleteUseCase.execute.mockResolvedValueOnce(undefined);
            
            await controller.delete(mockRequest as any, mockReply as any);
            
            expect(mockDeleteUseCase.execute).toHaveBeenCalledWith(mockRequest.params.id);
            expect(mockReply.status).toHaveBeenCalledWith(204);
            expect(mockReply.send).toHaveBeenCalledWith();
        });

        it('debe devolver status 400 si el el ID de la disciplina es inválido', async () => {

            mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('ID de disciplina inválido'));
            await controller.delete(mockRequest as any, mockReply as any);

            expect(mockDeleteUseCase.execute).toHaveBeenCalledWith(mockRequest.params.id);
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'ID de disciplina inválido' });
        });

        it('debe devolver status 404 si la disciplina no existe', async () => {

            mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('La disciplina no existe'));
            
            await controller.delete(mockRequest as any, mockReply as any);
            
            expect(mockDeleteUseCase.execute).toHaveBeenCalledWith(mockRequest.params.id);
            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'La disciplina no existe' });
        });

        it('debe devolver status 409 si la disciplina ya fue eliminada', async () => {

            mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('La disciplina ya fue eliminada'));
            
            await controller.delete(mockRequest as any, mockReply as any);
            
            expect(mockDeleteUseCase.execute).toHaveBeenCalledWith(mockRequest.params.id);
            expect(mockReply.status).toHaveBeenCalledWith(409);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'La disciplina ya fue eliminada' });
        });     
        
        it('debe devolver status 500 si hubo un error al eliminar la disciplina', async () => {

            mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('Error al eliminar la disciplina'));
            
            await controller.delete(mockRequest as any, mockReply as any);
            
            expect(mockDeleteUseCase.execute).toHaveBeenCalledWith(mockRequest.params.id);
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error al eliminar la disciplina' });
        });          
    });

});