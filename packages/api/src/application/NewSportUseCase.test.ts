import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSportUseCase } from './NewSportUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { CreateSport } from '@alentapp/shared';

describe('CreateSportUseCase', () => {

    const mockSportRepo = {
        create: vi.fn(),
    } as unknown as SportRepository;

    const mockSportValidator = {
        validateNameIsUnique: vi.fn(),
    } as unknown as SportValidator;

    const useCase = new CreateSportUseCase(mockSportRepo, mockSportValidator);

    const validCreateData: CreateSport = {
        name: 'Natación',
        description: 'Deporte individual',
        max_capacity: 15,
        additional_price: 10000,
        requires_medical_certificate: true,
    }

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe lanzar error si los datos son inválidos (rechazados por Zod)', async () => {
        const invalidData = { ...validCreateData, name:'' } as any;
        await expect(useCase.execute(invalidData)).rejects.toThrow();
        expect(mockSportValidator.validateNameIsUnique).not.toHaveBeenCalled();
        expect(mockSportRepo.create).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el nombre del deporte ya existe y no pertenece a un deporte eliminado', async () => {
        vi.mocked(mockSportValidator.validateNameIsUnique).mockRejectedValue(new Error('El nombre del deporte ya existe'));
        await expect(useCase.execute(validCreateData)).rejects.toThrow('El nombre del deporte ya existe');
        expect(mockSportRepo.create).not.toHaveBeenCalled();
    });

    it('debe crear el deporte y setear is_deleted e false si todo es válido', async () => {
        const expectedSport = { id: '1', ...validCreateData, is_deleted: false };
        vi.mocked(mockSportValidator.validateNameIsUnique).mockResolvedValueOnce(undefined);
        vi.mocked(mockSportRepo.create).mockResolvedValueOnce(expectedSport as any);
        await expect(useCase.execute(validCreateData)).resolves.toEqual(expectedSport);
        expect(mockSportValidator.validateNameIsUnique).toHaveBeenCalledWith(validCreateData.name);
        expect(mockSportRepo.create).toHaveBeenCalledWith({ ...validCreateData, is_deleted: false });
    });
});