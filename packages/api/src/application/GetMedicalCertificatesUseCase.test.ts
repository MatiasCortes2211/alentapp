import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetMedicalCertificatesUseCase } from './GetMedicalCertificatesUseCase.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';

describe('GetMedicalCertificatesUseCase', () => {
    const mockCertificateRepo = {
        findByMemberId: vi.fn(),
    } as unknown as MedicalCertificateRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const useCase = new GetMedicalCertificatesUseCase(mockCertificateRepo, mockMemberRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Test 1
    it('debe lanzar error si el memberId está vacío', async () => {
        await expect(useCase.execute('   '))
            .rejects.toThrow('El ID del socio es requerido');

        expect(mockCertificateRepo.findByMemberId).not.toHaveBeenCalled();
        expect(mockMemberRepo.findById).not.toHaveBeenCalled();
    });

    // Test 2
    it('debe retornar la lista de certificados del socio', async () => {
        const mockData = [{ id: 'cert-1', memberId: 'socio-123' }];
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: 'socio-123' } as any);
        vi.mocked(mockCertificateRepo.findByMemberId).mockResolvedValueOnce(mockData as any);

        const result = await useCase.execute('socio-123');

        expect(result).toEqual(mockData);
        expect(mockMemberRepo.findById).toHaveBeenCalledWith('socio-123');
        expect(mockCertificateRepo.findByMemberId).toHaveBeenCalledWith('socio-123');
    });

    // Test 3
    it('debe retornar un array vacío si el socio no tiene certificados', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: 'socio-123' } as any);
        vi.mocked(mockCertificateRepo.findByMemberId).mockResolvedValueOnce([]);
        const result = await useCase.execute('socio-123');
        expect(result).toEqual([]);
        expect(mockMemberRepo.findById).toHaveBeenCalledWith('socio-123');
        expect(mockCertificateRepo.findByMemberId).toHaveBeenCalledWith('socio-123');
    });
    
    it('debe lanzar error si el socio no existe', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute('socio-no-existe'))
            .rejects.toThrow('Socio inexistente');

        expect(mockMemberRepo.findById).toHaveBeenCalledWith('socio-no-existe');
        expect(mockCertificateRepo.findByMemberId).not.toHaveBeenCalled();
    });
});