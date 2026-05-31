import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateSportUseCase } from './UpdateSportUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { UpdateSport } from '@alentapp/shared';

describe('UpdateSportUseCase', () => {
    const mockSportRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as SportRepository;

    const mockSportValidator = {
        validateCanUpdateSport: vi.fn(),
    } as unknown as SportValidator;

    const useCase = new UpdateSportUseCase(mockSportRepo, mockSportValidator);

    const validUuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const validUpdateData: UpdateSport = {
        description: 'Natación sin agua',
        max_capacity: 20,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe lanzar error si la capacidad máxima es menor o igual a 0', async () => {
        const invalidData: UpdateSport = { max_capacity: 0 };
        await expect(useCase.execute(validUuid, invalidData)).rejects.toThrow();
        expect(mockSportRepo.findById).not.toHaveBeenCalled();
    });

    it('debe lanzar error si se intenta modificar el nombre', async () => {
        const invalidData = { max_capacity: 22, name: 'Natación' } as any;
        await expect(useCase.execute(validUuid, invalidData)).rejects.toThrow();
        expect(mockSportRepo.findById).not.toHaveBeenCalled();
    });

    it('debe lanzar error si se intenta modificar el precio adicional', async () => {
        const invalidData = { additional_price: 5000 } as any;
        await expect(useCase.execute(validUuid, invalidData)).rejects.toThrow();
        expect(mockSportRepo.findById).not.toHaveBeenCalled();
    });

    it('debe lanzar error si se intenta modificar la exigencia de certificado médico', async () => {
        const invalidData = { requires_medical_certificate: false } as any;
        await expect(useCase.execute(validUuid, invalidData)).rejects.toThrow();
        expect(mockSportRepo.findById).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el deporte a actualizar no existe', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(null);
        await expect(useCase.execute(validUuid, validUpdateData)).rejects.toThrow('El deporte no existe.');
        expect(mockSportValidator.validateCanUpdateSport).not.toHaveBeenCalled();
        expect(mockSportRepo.update).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el deporte ya está eliminado', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce({ id: validUuid, is_deleted: true } as any);
        await expect(useCase.execute(validUuid, validUpdateData)).rejects.toThrow('El deporte ya está eliminado.');
        expect(mockSportValidator.validateCanUpdateSport).not.toHaveBeenCalled();
        expect(mockSportRepo.update).not.toHaveBeenCalled();
    });

    it('debe lanzar error si la nueva capacidad es menor a la cantidad de inscriptos activos', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce({ id: validUuid, is_deleted: false } as any);
        const errorMessage = 'La capacidad máxima no puede ser menor a la cantidad de inscriptos activos.'
        vi.mocked(mockSportValidator.validateCanUpdateSport).mockRejectedValueOnce(new Error(errorMessage));
        await expect(useCase.execute(validUuid, validUpdateData)).rejects.toThrow(errorMessage);
        expect(mockSportRepo.update).not.toHaveBeenCalled()
    });

    it('debe actualizar el deporte exitosamente si se envían parámetros permitidos y válidos', async () => {
        const existingSport = {
            id: validUuid,
            name: 'Natación',
            description: 'Natación tradicional',
            max_capacity: 15,
            additional_price: 3500,
            requires_medical_certificate: true,
            is_deleted: false,
        };
        const updatedSport = { ...existingSport, ...validUpdateData };

        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(existingSport as any);
        vi.mocked(mockSportValidator.validateCanUpdateSport).mockResolvedValueOnce(undefined);
        vi.mocked(mockSportRepo.update).mockResolvedValueOnce(updatedSport as any);

        await expect(useCase.execute(validUuid, validUpdateData)).resolves.toEqual(updatedSport);
        expect(mockSportValidator.validateCanUpdateSport).toHaveBeenCalledWith(validUuid, validUpdateData.max_capacity);
        expect(mockSportRepo.update).toHaveBeenCalledWith(validUuid, validUpdateData);
    });
});