import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SportValidator } from './SportValidator.js';
import { SportRepository } from '../SportRepository.js';

describe('SportValidator', () => {
    const mockSportRepo = {
        findByName: vi.fn(),
        countActiveEnrollments: vi.fn(),
    } as unknown as SportRepository;

    const validator = new SportValidator(mockSportRepo);
    
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validateNameIsUnique', () => {
        it('debe lanzar error si ya existe un deporte con el mismo nombre', async () => {
            vi.mocked(mockSportRepo.findByName).mockResolvedValueOnce({ id: '1', name: 'Natación' } as any);
            await expect(validator.validateNameIsUnique('Natación')).rejects.toThrow('Ya existe un deporte con ese nombre.');
            expect(mockSportRepo.findByName).toHaveBeenCalledWith('Natación');
        });

        it('no debe lanzar error si no existe un deporte con el mismo nombre', async () => {
            vi.mocked(mockSportRepo.findByName).mockResolvedValueOnce(null);
            await expect(validator.validateNameIsUnique('Natación')).resolves.toBeUndefined();
            expect(mockSportRepo.findByName).toHaveBeenCalledWith('Natación');
        });
    });
});