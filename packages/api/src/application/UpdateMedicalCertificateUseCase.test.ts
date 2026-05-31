import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateMedicalCertificateUseCase } from './UpdateMedicalCertificateUseCase.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { MedicalCertificateValidator } from '../domain/services/MedicalCertificateValidator.js';
import { MedicalCertificateDTO } from '@alentapp/shared';

describe('UpdateMedicalCertificateUseCase - Actualización de Certificados Médicos', () => {
  const mockCertificateRepo = {
    findById: vi.fn(),
    update: vi.fn(),
    invalidatePriorCertificates: vi.fn(),
  } as unknown as MedicalCertificateRepository;

  const mockMemberRepo = {
    findById: vi.fn(),
  } as unknown as MemberRepository;

  const mockValidator = {
    validateMemberIsNotSuspended: vi.fn(),
  } as unknown as MedicalCertificateValidator;

  const useCase = new UpdateMedicalCertificateUseCase(
    mockCertificateRepo,
    mockMemberRepo,
    mockValidator
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TEST 1: Camino Feliz - Modificar fecha de vencimiento exitosamente', async () => {
    const certId = 'c77bc10b-58cc-4372-a567-0e02b2c3d999';
    const inputData = {
      expiry_date: '2026-12-31T00:00:00.000Z',
    };

    const existingCert = {
      id: certId,
      member_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      issue_date: '2026-05-28T00:00:00.000Z',
      expiry_date: '2026-08-28T00:00:00.000Z',
      doctor_license: 'MN-998877',
      is_validated: true,
    };

    const updatedDTO: MedicalCertificateDTO = {
      ...existingCert,
      expiry_date: inputData.expiry_date,
    };

    vi.mocked(mockCertificateRepo.findById).mockResolvedValueOnce(existingCert);
    vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ status: 'Activo' } as any);
    vi.mocked(mockValidator.validateMemberIsNotSuspended).mockReturnValue(undefined);
    vi.mocked(mockCertificateRepo.update).mockResolvedValueOnce(updatedDTO);

    const result = await useCase.execute(certId, inputData);

    expect(mockCertificateRepo.findById).toHaveBeenCalledWith(certId);
    expect(mockMemberRepo.findById).toHaveBeenCalledWith(existingCert.member_id);
    expect(mockValidator.validateMemberIsNotSuspended).toHaveBeenCalledWith('Activo');
    expect(mockCertificateRepo.update).toHaveBeenCalledWith(certId, inputData);
    expect(result.expiry_date).toBe(inputData.expiry_date);
  });

  it('TEST 2: Validación - Error si el certificado no existe (404)', async () => {
    const certId = 'c77bc10b-58cc-4372-a567-0e02b2c3d999';
    vi.mocked(mockCertificateRepo.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute(certId, { expiry_date: '2026-12-31T00:00:00.000Z' }))
      .rejects.toThrow('Recurso inexistente: Intento de modificar un certificado que no está en la base de datos.');

    expect(mockCertificateRepo.update).not.toHaveBeenCalled();
  });

  it('TEST 3: Regla de Negocio - Error si el socio está "Suspendido" (400)', async () => {
    const certId = 'c77bc10b-58cc-4372-a567-0e02b2c3d999';
    const existingCert = {
      id: certId,
      member_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      issue_date: '2026-05-28T00:00:00.000Z',
    };

    vi.mocked(mockCertificateRepo.findById).mockResolvedValueOnce(existingCert as any);
    vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ status: 'Suspendido' } as any);
    
    vi.mocked(mockValidator.validateMemberIsNotSuspended).mockImplementationOnce(() => {
      throw new Error('No se permiten realizar acciones sobre certificados médicos de un socio suspendido');
    });

    await expect(useCase.execute(certId, { expiry_date: '2026-12-31T00:00:00.000Z' }))
      .rejects.toThrow('No se permiten realizar acciones sobre certificados médicos de un socio suspendido');

    expect(mockCertificateRepo.update).not.toHaveBeenCalled();
  });

  it('TEST 4: Validación de Dominio - Error si nueva expiry es anterior a la issue original (400)', async () => {
    const certId = 'c77bc10b-58cc-4372-a567-0e02b2c3d999';
    const existingCert = {
      id: certId,
      member_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      issue_date: '2026-06-15T00:00:00.000Z',
    };

    vi.mocked(mockCertificateRepo.findById).mockResolvedValueOnce(existingCert as any);
    vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ status: 'Activo' } as any);
    vi.mocked(mockValidator.validateMemberIsNotSuspended).mockReturnValue(undefined);

    await expect(useCase.execute(certId, { expiry_date: '2026-06-10T00:00:00.000Z' }))
      .rejects.toThrow('Fechas inválidas: Si al actualizar, la nueva fecha de vencimiento resulta menor o igual a la de emisión.');

    expect(mockCertificateRepo.update).not.toHaveBeenCalled();
  });

  it('TEST 5: Camino Feliz - Actualizar matrícula del médico sin validación de fechas', async () => {
    const certId = 'c77bc10b-58cc-4372-a567-0e02b2c3d999';
    const inputData = {
      doctor_license: 'MN-665544',
    };

    const existingCert = {
      id: certId,
      member_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      issue_date: '2026-05-28T00:00:00.000Z',
      expiry_date: '2026-08-28T00:00:00.000Z',
      doctor_license: 'MN-998877',
      is_validated: true,
    };

    const updatedDTO: MedicalCertificateDTO = {
      ...existingCert,
      doctor_license: inputData.doctor_license,
    };

    vi.mocked(mockCertificateRepo.findById).mockResolvedValueOnce(existingCert);
    vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ status: 'Activo' } as any);
    vi.mocked(mockValidator.validateMemberIsNotSuspended).mockReturnValue(undefined);
    vi.mocked(mockCertificateRepo.update).mockResolvedValueOnce(updatedDTO);

    const result = await useCase.execute(certId, inputData);

    expect(mockCertificateRepo.findById).toHaveBeenCalledWith(certId);
    expect(mockMemberRepo.findById).toHaveBeenCalledWith(existingCert.member_id);
    expect(mockCertificateRepo.update).toHaveBeenCalledWith(certId, inputData);
    expect(result.doctor_license).toBe(inputData.doctor_license);
  });
});

