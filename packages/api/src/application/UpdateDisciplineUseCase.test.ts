import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateDisciplineUseCase } from './UpdateDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';

describe('UpdateDisciplineUseCase', () => {
    const mockDisciplineRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as MemberRepository;

    const mockDisciplineValidator = {
        validateEndDate: vi.fn(),
        validateDisciplineValidity: vi.fn(),
    } as unknown as DisciplineValidator;

    const useCase = new UpdateDisciplineUseCase(mockDisciplineRepo, mockDisciplineValidator, mockMemberRepo);

    const validId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const validMemberId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
    const newMemberId = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

    const existingDiscipline = {
        id: validId,
        reason: 'Razón original',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        is_total_suspension: false,
        member_id: validMemberId,
        is_deleted: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValue(existingDiscipline as any);
        vi.mocked(mockDisciplineValidator.validateEndDate).mockResolvedValue(undefined);
        vi.mocked(mockDisciplineValidator.validateDisciplineValidity).mockResolvedValue(false);
    });

    it('debe lanzar error si el ID de disciplina es inválido', async () => {
        await expect(useCase.execute('id-invalido', {})).rejects.toThrow('ID de disciplina inválido');
        expect(mockDisciplineRepo.findById).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el ID del miembro es inválido', async () => {
        await expect(useCase.execute(validId, { member_id: 'id-invalido' })).rejects.toThrow('ID de miembro vacío o inválido');
        expect(mockDisciplineRepo.findById).not.toHaveBeenCalled();
    });

    it('debe lanzar error si la disciplina no existe', async () => {
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute(validId, {})).rejects.toThrow('La disciplina no existe');
        expect(mockDisciplineRepo.update).not.toHaveBeenCalled();
    });

    it('debe lanzar error si la disciplina ya fue eliminada', async () => {
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce({ ...existingDiscipline, is_deleted: true } as any);

        await expect(useCase.execute(validId, {})).rejects.toThrow('La disciplina no existe');
        expect(mockDisciplineRepo.update).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el miembro ingresado no existe', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute(validId, { member_id: validMemberId })).rejects.toThrow('El miembro ingresado no existe en el sistema');
        expect(mockDisciplineRepo.update).not.toHaveBeenCalled();
    });

    it('debe lanzar error si la fecha de fin es anterior o igual a la de inicio', async () => {
        vi.mocked(mockDisciplineValidator.validateEndDate).mockRejectedValueOnce(
            new Error('La fecha de fin debe ser posterior a la fecha de inicio')
        );

        await expect(useCase.execute(validId, { end_date: '2025-01-01' })).rejects.toThrow('La fecha de fin debe ser posterior a la fecha de inicio');
        expect(mockDisciplineRepo.update).not.toHaveBeenCalled();
    });

    it('debe lanzar error si la razón está vacía', async () => {
        await expect(useCase.execute(validId, { reason: '' })).rejects.toThrow('Razón no puede estar vacía.');
        expect(mockDisciplineRepo.findById).not.toHaveBeenCalled();
    });

    it('debe actualizar correctamente la disciplina', async () => {
        vi.mocked(mockDisciplineRepo.update).mockResolvedValueOnce({ ...existingDiscipline, reason: 'Razón actualizada' } as any);

        const result = await useCase.execute(validId, { reason: 'Razón actualizada' });

        expect(mockDisciplineRepo.update).toHaveBeenCalledWith(validId, { reason: 'Razón actualizada' });
        expect(mockMemberRepo.update).not.toHaveBeenCalled();
        expect(result.reason).toBe('Razón actualizada');
    });

    it('debe cambiar el estado del miembro a Suspendido si se modifica la fecha y la disciplina pasa a ser vigente', async () => {
        const today = new Date();
        const futureDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];
        
        vi.mocked(mockDisciplineValidator.validateDisciplineValidity).mockResolvedValueOnce(true);
        vi.mocked(mockDisciplineRepo.update).mockResolvedValueOnce({ ...existingDiscipline, end_date: futureDate } as any);

        await useCase.execute(validId, { end_date: futureDate });

        expect(mockMemberRepo.update).toHaveBeenCalledWith(existingDiscipline.member_id, { status: 'Suspendido' });
    });


    it('no debe cambiar el estado del miembro si se modifica la fecha pero la disciplina no es vigente', async () => {
        const today = new Date();
        const pastDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];
        
        vi.mocked(mockDisciplineValidator.validateDisciplineValidity).mockResolvedValueOnce(false);
        vi.mocked(mockDisciplineRepo.update).mockResolvedValueOnce({ ...existingDiscipline, end_date: pastDate } as any);

        await useCase.execute(validId, { end_date: pastDate });

        expect(mockMemberRepo.update).not.toHaveBeenCalled();
    });


});