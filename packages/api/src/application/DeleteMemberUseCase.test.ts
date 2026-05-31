import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteMemberUseCase } from './DeleteMemberUseCase.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { LockerRepository } from '../domain/LockerRepository.js';
describe('DeleteMemberUseCase', () => {
    const mockMemberRepo = {
        findById: vi.fn(),
        delete: vi.fn(),
    } as unknown as MemberRepository;

    const mockPaymentRepo = {
        softDeleteByMemberId: vi.fn(),
    } as unknown as PaymentRepository;

    const mockDisciplineRepo = {
        softDeleteByMemberId: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockLockerRepo = {
        releaseByMemberId: vi.fn(),
    } as unknown as LockerRepository;

    const useCase = new DeleteMemberUseCase(mockMemberRepo, mockPaymentRepo, mockDisciplineRepo, mockLockerRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe lanzar error si el miembro no existe', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);
        await expect(useCase.execute('uuid-999')).rejects.toThrow('El miembro no existe');
        expect(mockMemberRepo.delete).not.toHaveBeenCalled();
    });

    it('debe eliminar el miembro si existe', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: 'uuid-1' } as any);
        await useCase.execute('uuid-1');
        expect(mockMemberRepo.delete).toHaveBeenCalledWith('uuid-1');
        expect(mockPaymentRepo.softDeleteByMemberId).toHaveBeenCalledWith('uuid-1');
        expect(mockDisciplineRepo.softDeleteByMemberId).toHaveBeenCalledWith('uuid-1');
        expect(mockLockerRepo.releaseByMemberId).toHaveBeenCalledWith('uuid-1');
        expect(mockMemberRepo.delete).toHaveBeenCalledWith('uuid-1');
    });
});
