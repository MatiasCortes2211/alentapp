import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteSportUseCase } from './DeleteSportUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';

describe('DeleteSportUseCase', () => {
    const mockSportRepo = {
        findById: vi.fn(),
        delete: vi.fn(),
    } as unknown as SportRepository;

    const useCase = new DeleteSportUseCase(mockSportRepo);
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe lanzar error si el formato del ID es inválido', async () => {
        await expect(useCase.execute('id-invalido')).rejects.toThrow('ID inválido.');
        expect(mockSportRepo.findById).not.toHaveBeenCalled();
        expect(mockSportRepo.delete).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el deporte no existe', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(null);
        await expect(useCase.execute(validUuid)).rejects.toThrow('El deporte no existe.');
        expect(mockSportRepo.delete).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el deporte ya está eliminado', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce({ id: validUuid, is_deleted: true } as any);
        await expect(useCase.execute(validUuid)).rejects.toThrow('El deporte ya está eliminado.');
        expect(mockSportRepo.delete).not.toHaveBeenCalled();
    });

    it('debe eliminar el deporte si existe y no está eliminado', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce({ id: validUuid, is_deleted: false } as any);
        await expect(useCase.execute(validUuid)).resolves.toBeUndefined();
        expect(mockSportRepo.delete).toHaveBeenCalledWith(validUuid);
    });
});