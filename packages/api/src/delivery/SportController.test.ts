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

    let mockRequest: any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('create', () => {
        beforeEach(() => {
            mockRequest = {
                body: {
                    name: 'Natación',
                    description: 'Deporte individual',
                    max_capacity: 15,
                    additional_price: 10000,
                    requires_medical_certificate: true,
                }
            };
        });

        it('debe devolver status 201 y el deporte creado si la creación es exitosa', async () => {
            const expectedSport = { id: '1', ...mockRequest.body, is_deleted: false };
            vi.mocked(mockCreateUseCase.execute).mockResolvedValueOnce(expectedSport);

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockCreateUseCase.execute).toHaveBeenCalledWith(mockRequest.body);
            expect(mockReply.status).toHaveBeenCalledWith(201);
            expect(mockReply.send).toHaveBeenCalledWith({ data: expectedSport });
        });

        it('debe devolver status 400 si hay un error de validación (Zod)', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('El nombre es obligatorio.'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El nombre es obligatorio.' });
        });

        it('debe devolver status 409 si el nombre del deporte ya existe', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Ya existe un deporte con ese nombre.'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(409);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Ya existe un deporte con ese nombre.' });
        });

        it('debe devolver status 500 para cualquier otro error', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Error inesperado'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Ocurrió un error inesperado. Por favor, intentá de nuevo más tarde.' });
        });
    });

    describe('update', () => {
        beforeEach(() => {
            mockRequest = {
                params: { id: 'uuid-valido' },
                body: { description: 'Nueva descripción', max_capacity: 20 }
            };
        });

        it('debe devolver status 200 y el deporte actualizado si la operación es exitosa', async () => {
            const mockSport = { id: mockRequest.params.id, ...mockRequest.body };
            mockUpdateUseCase.execute.mockResolvedValueOnce(mockSport);

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockUpdateUseCase.execute).toHaveBeenCalledWith(mockRequest.params.id, mockRequest.body);
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockSport });
        });

        it('debe devolver status 400 si se intentan modificar campos inmutables', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('Unrecognized key'));

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'No se pueden modificar campos inmutables tras la creación del deporte.' });
        });

        it('debe devolver status 400 si hay un error de validación de Zod', async () => {
            const zodErrorMessage = 'La capacidad máxima debe ser mayor a 0.';
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error(zodErrorMessage));

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: zodErrorMessage });
        });

        it('debe devolver status 404 si el deporte no existe', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('El deporte no existe.'));

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El deporte no existe.' });
        });

        it('debe devolver status 409 si el deporte ya está eliminado', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('El deporte ya está eliminado.'));

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(409);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El deporte ya está eliminado.' });
        });

        it('debe devolver status 409 si la capacidad máxima es menor a los inscriptos', async () => {
            const errorMessage = 'La capacidad máxima no puede ser menor a la cantidad de inscriptos activos.';
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error(errorMessage));

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(409);
            expect(mockReply.send).toHaveBeenCalledWith({ error: errorMessage });
        });

        it('debe devolver status 500 ante cualquier otro error inesperado', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('Error inesperado'));

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Ocurrió un error inesperado. Por favor, intentá de nuevo más tarde.' });
        });
    });

    describe('delete', () => {
        beforeEach(() => {
            mockRequest = {
                params: { id: 'uuid-valido' },
            };
        });

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