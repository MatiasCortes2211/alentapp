import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteDisciplineUseCase } from './DeleteDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';

describe('DeleteDisciplineUseCase', () => {
    const mockDisciplineRepo = {
        findById: vi.fn(),
        delete: vi.fn(),
    } as unknown as DisciplineRepository;


    const useCase = new DeleteDisciplineUseCase(mockDisciplineRepo);

    const validId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe lanzar error si la disciplina no existe', async () => {
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce(null);
        await expect(useCase.execute(validId)).rejects.toThrow('La disciplina no existe');
        expect(mockDisciplineRepo.delete).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el ID de la disciplina no es UUID', async () => {
        await expect(useCase.execute('not-a-uuid')).rejects.toThrow('ID de disciplina inválido');
        expect(mockDisciplineRepo.findById).not.toHaveBeenCalled();
        expect(mockDisciplineRepo.delete).not.toHaveBeenCalled();
    });

    it('debe lanzar error si la disciplina ya fue eliminada', async () => {
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce({ id: validId, is_deleted: true } as any);
        await expect(useCase.execute(validId)).rejects.toThrow('La disciplina ya fue eliminada');
        expect(mockDisciplineRepo.delete).not.toHaveBeenCalled();
    });

    it('debe eliminar la disciplina si existe y no fue eliminada', async () => {
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce({ id: validId, is_deleted: false } as any);

        await useCase.execute(validId);

        expect(mockDisciplineRepo.delete).toHaveBeenCalledWith(validId);
    });
});

