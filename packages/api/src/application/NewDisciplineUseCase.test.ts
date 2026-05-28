import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateDisciplineUseCase } from './NewDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';
import { CreateDiscipline } from '@alentapp/shared';
import { MemberRepository } from '../domain/MemberRepository.js';

describe('CreateDisciplineUseCase', () => {
    // 1. Creamos Mocks de nuestras dependencias (Puertos y Servicios)
    const mockDisciplineRepo = {
        create: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as MemberRepository;

    const mockDisciplineValidator = {
        validateEndDate: vi.fn(),
        validateDisciplineValidity: vi.fn(),
    } as unknown as DisciplineValidator;

    const useCase = new CreateDisciplineUseCase(mockDisciplineRepo, mockDisciplineValidator, mockMemberRepo);

    const validMemberId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    const validRequest = {
        reason: 'Conducta inapropiada',
        start_date: '2026-01-01',
        end_date: '2026-02-01',
        is_total_suspension: false,
        member_id: validMemberId,
    };


    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe lanzar error si el miembro no existe', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute(validRequest)).rejects.toThrow('El miembro ingresado no existe en el sistema');
        expect(mockMemberRepo.update).not.toHaveBeenCalled();
        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
    });

    it('debe lanzar error si la fecha fin es anterior a la de inicio', async () => {
        vi.mocked(mockDisciplineValidator.validateEndDate).mockRejectedValueOnce(
            new Error('La fecha de fin debe ser posterior a la fecha de inicio')
        );

        await expect(useCase.execute(validRequest)).rejects.toThrow('La fecha de fin debe ser posterior a la fecha de inicio');
        expect(mockMemberRepo.findById).not.toHaveBeenCalled();
        expect(mockMemberRepo.update).not.toHaveBeenCalled();
        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
    });

    it('debe crear la disciplina y cambiar el status del miembro a Suspendido si la disciplina es vigente', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: validMemberId } as any);
        vi.mocked(mockDisciplineValidator.validateEndDate).mockResolvedValueOnce(undefined);
        vi.mocked(mockDisciplineValidator.validateDisciplineValidity).mockResolvedValueOnce(true);
        vi.mocked(mockDisciplineRepo.create).mockResolvedValueOnce({
            id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
            ...validRequest,
            is_deleted: false,
        });

        const result = await useCase.execute(validRequest);

        expect(mockDisciplineRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            reason: 'Conducta inapropiada',
            is_deleted: false,
        }));
        expect(mockMemberRepo.update).toHaveBeenCalledWith(validMemberId, { status: 'Suspendido' });
        expect(result.id).toBeDefined();
    });

    it('debe crear la disciplina y no cambiar el status del miembro a Suspendido si la disciplina no es vigente', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: validMemberId } as any);
        vi.mocked(mockDisciplineValidator.validateEndDate).mockResolvedValueOnce(undefined);
        vi.mocked(mockDisciplineValidator.validateDisciplineValidity).mockResolvedValueOnce(false);
        vi.mocked(mockDisciplineRepo.create).mockResolvedValueOnce({
            id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
            ...validRequest,
            is_deleted: false,
        });

        const result = await useCase.execute(validRequest);

        expect(mockDisciplineRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            reason: 'Conducta inapropiada',
            is_deleted: false,
        }));
        expect(mockMemberRepo.update).not.toHaveBeenCalled();
        expect(result.id).toBeDefined();
    });

    //Validaciones Zod

    it('debe lanzar error si faltan campos obligatorios', async () => {
        const invalidRequest = { ...validRequest, amount: undefined } as any;
        await expect(useCase.execute(invalidRequest)).rejects.toThrow();
        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
    });

    it('debe lanzar error si la razón está vacía', async () => {
        const invalidRequest = { ...validRequest, reason: '' };

        await expect(useCase.execute(invalidRequest)).rejects.toThrow('Razón es un campo requerido y no puede estar vacío.');
        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
        expect(mockMemberRepo.findById).not.toHaveBeenCalled();
        expect(mockMemberRepo.update).not.toHaveBeenCalled();
        
    });

    it('debe lanzar error si la razón supera los 40 caracteres', async () => {
        const invalidRequest = { ...validRequest, reason: 'a'.repeat(41) };
        await expect(useCase.execute(invalidRequest)).rejects.toThrow('Razón no puede tener más de 40 caracteres.');
        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
        expect(mockMemberRepo.findById).not.toHaveBeenCalled();
        expect(mockMemberRepo.update).not.toHaveBeenCalled();
    });

    it('debe lanzar error si la fecha de inicio está vacía', async () => {
        const invalidRequest = { ...validRequest, start_date: '' };
        await expect(useCase.execute(invalidRequest)).rejects.toThrow('La fecha de inicio es obligatoria');
        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
        expect(mockMemberRepo.findById).not.toHaveBeenCalled();
        expect(mockMemberRepo.update).not.toHaveBeenCalled();
    });

    it('debe lanzar error si la fecha de fin está vacía', async () => {
        const invalidRequest = { ...validRequest, end_date: '' };
        await expect(useCase.execute(invalidRequest)).rejects.toThrow('La fecha de fin es obligatoria');
        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
        expect(mockMemberRepo.findById).not.toHaveBeenCalled();
        expect(mockMemberRepo.update).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el member_id no es un UUID válido', async () => {
        const invalidRequest = { ...validRequest, member_id: 'id-invalido' };
        await expect(useCase.execute(invalidRequest)).rejects.toThrow('ID de miembro inválido.');
        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
        expect(mockMemberRepo.findById).not.toHaveBeenCalled();
        expect(mockMemberRepo.update).not.toHaveBeenCalled();
    });
});