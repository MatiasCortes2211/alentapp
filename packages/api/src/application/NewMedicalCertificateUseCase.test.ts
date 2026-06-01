import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NewMedicalCertificateUseCase } from './NewMedicalCertificateUseCase.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { MedicalCertificateValidator } from '../domain/services/MedicalCertificateValidator.js';
import { MedicalCertificateDTO, CreateMedicalCertificate } from '@alentapp/shared';

describe('NewMedicalCertificateUseCase - Creación de Certificados Médicos', () => {
  // mocks
  const mockCertificateRepo = {
    create: vi.fn(),
    invalidatePriorCertificates: vi.fn(),
    findById: vi.fn(),
    findByNumber: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    releaseByMemberId: vi.fn(),
    softDeleteByMemberId: vi.fn(),
  } as unknown as MedicalCertificateRepository;

  const mockMemberRepo = {
    findById: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByDni: vi.fn(),
  } as unknown as MemberRepository;

  const mockValidator = {
    validate: vi.fn(),
    validateMemberIsNotSuspended: vi.fn(),
  } as unknown as MedicalCertificateValidator;

  const useCase = new NewMedicalCertificateUseCase(
    mockCertificateRepo,
    mockMemberRepo,
    mockValidator
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1
  describe('TEST 1: Camino Feliz - Crear Certificado (Socio Activo)', () => {
    it('debería registrar el certificado exitosamente, invalidar certificados anteriores y retornar el DTO creado', async () => {
      const inputData: CreateMedicalCertificate = {
        member_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        issue_date: '2026-05-28T00:00:00.000Z',
        expiry_date: '2026-08-28T00:00:00.000Z',
        doctor_license: 'MN-998877',
      };

      const expectedDTO: MedicalCertificateDTO = {
        id: 'cert-nuevo-123',
        member_id: inputData.member_id,
        issue_date: inputData.issue_date,
        expiry_date: inputData.expiry_date,
        doctor_license: inputData.doctor_license,
        is_validated: true,
      };

      // Mock: Validación pasa sin error
      vi.mocked(mockValidator.validate).mockReturnValue(undefined);

      // Mock: Socio existe y está Activo
      vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({
        id: inputData.member_id,
        name: 'Socio Test',
        status: 'Activo',
        dni: '12345678',
        email: 'socio@test.com',
        birthdate: '1990-01-01',
        category: 'Pleno',
        created_at: new Date(),
      } as any);

      // Mock: invalidatePriorCertificates se ejecuta sin error
      vi.mocked(mockCertificateRepo.invalidatePriorCertificates).mockResolvedValueOnce(
        undefined
      );

      // Mock: Crear certificado retorna el DTO
      vi.mocked(mockCertificateRepo.create).mockResolvedValueOnce(expectedDTO);

      const result = await useCase.execute(inputData);

      expect(mockValidator.validate).toHaveBeenCalledOnce();
      expect(mockValidator.validate).toHaveBeenCalledWith(inputData);

      expect(mockMemberRepo.findById).toHaveBeenCalledOnce();
      expect(mockMemberRepo.findById).toHaveBeenCalledWith(inputData.member_id);

      expect(mockCertificateRepo.invalidatePriorCertificates).toHaveBeenCalledOnce();
      expect(mockCertificateRepo.invalidatePriorCertificates).toHaveBeenCalledWith(
        inputData.member_id
      );

      expect(mockCertificateRepo.create).toHaveBeenCalledOnce();
      expect(mockCertificateRepo.create).toHaveBeenCalledWith(inputData);

      expect(result).toEqual(expectedDTO);
      expect(result.id).toBe('cert-nuevo-123');
      expect(result.is_validated).toBe(true);
    });
  });

  // Test 2

  describe('TEST 2: Validación - Socio Inexistente', () => {
    it('debería lanzar error si el socio no existe en la base de datos y NO llamar a create()', async () => {
      const inputData: CreateMedicalCertificate = {
        member_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        issue_date: '2026-05-28T00:00:00.000Z',
        expiry_date: '2026-08-28T00:00:00.000Z',
        doctor_license: 'MN-998877',
      };

      // Mock: Validación pasa
      vi.mocked(mockValidator.validate).mockReturnValue(undefined);

      // Mock: Socio no existe (retorna null)
      vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);

      await expect(useCase.execute(inputData)).rejects.toThrow('Socio inexistente');

      expect(mockCertificateRepo.invalidatePriorCertificates).not.toHaveBeenCalled();
      expect(mockCertificateRepo.create).not.toHaveBeenCalled();
    });
  });

  // Test 3
  describe('TEST 3: Validación - Socio Suspendido', () => {
    it('debería rechazar la creación si el socio se encuentra en estado "Suspendido"', async () => {
      const inputData: CreateMedicalCertificate = {
        member_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        issue_date: '2026-05-28T00:00:00.000Z',
        expiry_date: '2026-08-28T00:00:00.000Z',
        doctor_license: 'MN-998877',
      };

      // Mock: Validación pasa
      vi.mocked(mockValidator.validate).mockReturnValue(undefined);

      // Mock: Socio existe pero está Suspendido
      vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({
        id: inputData.member_id,
        name: 'Socio Suspendido',
        status: 'Suspendido', 
        dni: '12345678',
        email: 'socio@test.com',
        birthdate: '1990-01-01',
        category: 'Pleno',
        created_at: new Date(),
      } as any);

      await expect(useCase.execute(inputData)).rejects.toThrow(
        'No se permiten realizar acciones sobre certificados médicos de un socio suspendido'
      );

      expect(mockCertificateRepo.invalidatePriorCertificates).not.toHaveBeenCalled();
      expect(mockCertificateRepo.create).not.toHaveBeenCalled();
    });
  });

  // test 4
  describe('TEST 4: Validación de Dominio - Expiry', () => {
    it('debería rechazar si la fecha de vencimiento es anterior o igual a la de emisión', async () => {
      const inputData: CreateMedicalCertificate = {
        member_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        issue_date: '2026-06-15T00:00:00.000Z',
        expiry_date: '2026-06-10T00:00:00.000Z', // ← INVÁLIDO: Menor a issue_date
        doctor_license: 'MN-998877',
      };

      // Mock: El validador detecta la inconsistencia de fechas
      vi.mocked(mockValidator.validate).mockImplementation(() => {
        throw new Error('La fecha de vencimiento debe ser posterior a la de emisión');
      });

      await expect(useCase.execute(inputData)).rejects.toThrow(
        'La fecha de vencimiento debe ser posterior a la de emisión'
      );

      expect(mockMemberRepo.findById).not.toHaveBeenCalled();
      expect(mockCertificateRepo.invalidatePriorCertificates).not.toHaveBeenCalled();
      expect(mockCertificateRepo.create).not.toHaveBeenCalled();
    });
  });

  // Test 5
  describe('TEST 5: Validación de Dominio - Certificado Vencido', () => {
    it('debería rechazar si se intenta cargar un certificado con fecha de vencimiento en el pasado', async () => {
      const inputData: CreateMedicalCertificate = {
        member_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        issue_date: '2025-01-01T00:00:00.000Z',
        expiry_date: '2025-02-01T00:00:00.000Z', 
        doctor_license: 'MN-998877',
      };

      vi.mocked(mockValidator.validate).mockImplementation(() => {
        throw new Error('No se puede cargar un certificado con fecha de vencimiento pasada');
      });

      await expect(useCase.execute(inputData)).rejects.toThrow(
        'No se puede cargar un certificado con fecha de vencimiento pasada'
      );

      expect(mockMemberRepo.findById).not.toHaveBeenCalled();
      expect(mockCertificateRepo.invalidatePriorCertificates).not.toHaveBeenCalled();
      expect(mockCertificateRepo.create).not.toHaveBeenCalled();
    });
  });
});