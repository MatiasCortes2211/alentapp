import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetMedicalCertificatesUseCase } from './GetMedicalCertificatesUseCase.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';

describe('GetMedicalCertificatesUseCase', () => {
    const mockRepo = {
        findByMemberId: vi.fn(),
    } as unknown as MedicalCertificateRepository;

    const useCase = new GetMedicalCertificatesUseCase(mockRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Test 1
    it('debe lanzar error si el memberId está vacío', async () => {
        await expect(useCase.execute('   '))
            .rejects.toThrow('El ID del socio es requerido');

        expect(mockRepo.findByMemberId).not.toHaveBeenCalled();
    });

    // Test 2
    it('debe retornar la lista de certificados del socio', async () => {
        const mockData = [{ id: 'cert-1', memberId: 'socio-123' }];
        vi.mocked(mockRepo.findByMemberId).mockResolvedValueOnce(mockData as any);

        const result = await useCase.execute('socio-123');

        expect(result).toEqual(mockData);
        expect(mockRepo.findByMemberId).toHaveBeenCalledWith('socio-123');
    });

    // Test 3
    it('debe retornar un array vacío si el socio no tiene certificados', async () => {
        vi.mocked(mockRepo.findByMemberId).mockResolvedValueOnce([]);
        const result = await useCase.execute('socio-123');
        expect(result).toEqual([]);
    });
});