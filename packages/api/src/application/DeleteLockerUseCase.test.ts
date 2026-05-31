import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteLockerUseCase } from './DeleteLockerUseCase.js';
import { LockerRepository } from '../domain/LockerRepository.js';

describe('DeleteLockerUseCase', () => {
    const mockLockerRepo = {
        findById: vi.fn(),
        delete: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findAll: vi.fn(),
        findByNumber: vi.fn(),
        releaseByMemberId: vi.fn()
    } as unknown as LockerRepository;

    const useCase = new DeleteLockerUseCase(mockLockerRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('1. Debe eliminar el casillero exitosamente', async () => {
        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce({
            id: validUuid, status: 'Occupied', is_deleted: false, member_id: 'otro-uuid'
        } as any);

        await expect(useCase.execute(validUuid)).resolves.not.toThrow();
        
        expect(mockLockerRepo.delete).toHaveBeenCalledWith(validUuid);
        expect(mockLockerRepo.delete).toHaveBeenCalledTimes(1);
    });

    it('2. Debe lanzar error si el casillero a eliminar no existe', async () => {
        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute(validUuid)).rejects.toThrow('El casillero no existe');
        
        expect(mockLockerRepo.delete).not.toHaveBeenCalled();
    });

    it('3. Debe lanzar error si el casillero ya fue eliminado previamente', async () => {
        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce({
            id: validUuid, status: 'Available', is_deleted: true
        } as any);

        await expect(useCase.execute(validUuid)).rejects.toThrow('El casillero ya fue eliminado previamente');
        
        expect(mockLockerRepo.delete).not.toHaveBeenCalled();
    });

    it('4. Debe lanzar error si el ID provisto no es un UUID válido', async () => {
        const invalidId = 'id-invalido-123';

        await expect(useCase.execute(invalidId)).rejects.toThrow('El formato del ID es inválido');
        
        expect(mockLockerRepo.findById).not.toHaveBeenCalled();
        expect(mockLockerRepo.delete).not.toHaveBeenCalled();
    });
});