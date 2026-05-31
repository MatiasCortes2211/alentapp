import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteMedicalCertificateUseCase } from './DeleteMedicalCertificateUseCase.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { MedicalCertificateValidator } from '../domain/services/MedicalCertificateValidator.js';

describe('DeleteMedicalCertificateUseCase', () => {
	const mockCertRepo = {
		findById: vi.fn(),
		delete: vi.fn(),
	} as unknown as MedicalCertificateRepository;

	const mockMemberRepo = {
		findById: vi.fn(),
	} as unknown as MemberRepository;

	const mockValidator = {
		validateMemberIsNotSuspended: vi.fn(),
	} as unknown as MedicalCertificateValidator;

	const useCase = new DeleteMedicalCertificateUseCase(mockCertRepo, mockMemberRepo, mockValidator);
	const validUuid = '123e4567-e89b-12d3-a456-426614174000';
	const memberId = '123e4567-e89b-12d3-a456-426614174111';

	beforeEach(() => {
		vi.clearAllMocks();
	});

    // test 1
	it('TEST 1: Camino feliz - elimina el certificado si existe', async () => {
		vi.mocked(mockCertRepo.findById).mockResolvedValueOnce({ id: validUuid, member_id: memberId, is_deleted: false } as any);
		vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: memberId, status: 'Activo' } as any);
		await expect(useCase.execute(validUuid)).resolves.toBeUndefined();
		expect(mockCertRepo.delete).toHaveBeenCalledWith(validUuid);
	});

    // Test 2
	it('TEST 2: Validación UUID - lanza error si el ID no es UUID', async () => {
		await expect(useCase.execute('id-invalido')).rejects.toThrow('El id debe tener formato UUID válido.');
		expect(mockCertRepo.findById).not.toHaveBeenCalled();
		expect(mockCertRepo.delete).not.toHaveBeenCalled();
	});

    // Test 3
	it('TEST 3: Fallo por recurso inexistente - no se puede eliminar un certificado que no está registrado', async () => {
		vi.mocked(mockCertRepo.findById).mockResolvedValueOnce(null);
		await expect(useCase.execute(validUuid)).rejects.toThrow(
			'Recurso Inexistente: El certificado que se intenta eliminar no está en la DB.'
		);
		expect(mockCertRepo.delete).not.toHaveBeenCalled();
	});
});

