import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateLockerUseCase } from './UpdateLockerUseCase.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { UpdateLockerRequest } from '@alentapp/shared';

describe('UpdateLockerUseCase', () => {
    const mockLockerRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as LockerRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const mockLockerValidator = {
        validateNumberIsUnique: vi.fn(),
        validateAssignmentIntegrity: vi.fn(),
        validateEndContractDate: vi.fn(),
        validateMemberIsNotSuspended: vi.fn(),
        validateStatusForAssignment: vi.fn(),
    } as unknown as LockerValidator;

    const useCase = new UpdateLockerUseCase(mockLockerRepo, mockMemberRepo, mockLockerValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('1. Debe lanzar error si el casillero a editar no existe o está eliminado', async () => {
        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute('locker-falso', { status: 'Maintenance' }))
            .rejects.toThrow('El casillero no existe');
        
        expect(mockLockerRepo.update).not.toHaveBeenCalled();
    });

    it('2. Debe actualizar campos básicos correctamente (ej. cambiar a Maintenance)', async () => {
        const lockerId = 'locker-123';
        const existingLocker = {
            id: lockerId,
            number: 10,
            location: 'Male',
            status: 'Available',
            is_deleted: false,
            member_id: null,
            end_contract_date: null
        };

        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce(existingLocker as any);
        vi.mocked(mockLockerRepo.update).mockResolvedValueOnce({
            ...existingLocker,
            status: 'Maintenance'
        } as any);

        const result = await useCase.execute(lockerId, { status: 'Maintenance' });

        expect(mockLockerRepo.update).toHaveBeenCalledWith(lockerId, expect.objectContaining({
            status: 'Maintenance'
        }));
        expect(result.status).toBe('Maintenance');
    });

    it('3. Debe forzar estado a Occupied al asignar un socio nuevo', async () => {
        const lockerId = 'locker-123';
        const fakeMemberId = 'b916bb49-2fb0-45fa-ab44-3d07747e4eb1';
        
        const existingLocker = {
            id: lockerId, number: 10, status: 'Available', is_deleted: false, member_id: null
        };

        const updateRequest: UpdateLockerRequest = {
            member_id: fakeMemberId,
            end_contract_date: '2027-12-31T00:00:00.000Z'
        };

        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce(existingLocker as any);
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: fakeMemberId, status: 'Activo' } as any);
        
        vi.mocked(mockLockerRepo.update).mockResolvedValueOnce({
            ...existingLocker,
            member_id: fakeMemberId,
            status: 'Occupied'
        } as any);

        const result = await useCase.execute(lockerId, updateRequest);

        expect(mockLockerRepo.update).toHaveBeenCalledWith(lockerId, expect.objectContaining({
            member_id: fakeMemberId,
            status: 'Occupied'
        }));
        expect(result.status).toBe('Occupied');
    });

    it('4. Debe forzar estado a Available al quitar el socio asignado', async () => {
        const lockerId = 'locker-123';
        const fakeMemberId = 'b916bb49-2fb0-45fa-ab44-3d07747e4eb1';
        
        // Casillero actualmente ocupado por un socio
        const existingLocker = {
            id: lockerId, number: 10, status: 'Occupied', is_deleted: false, member_id: fakeMemberId
        };

        const updateRequest: UpdateLockerRequest = {
            member_id: null,
            end_contract_date: null
        };

        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce(existingLocker as any);
        
        vi.mocked(mockLockerRepo.update).mockResolvedValueOnce({
            ...existingLocker,
            member_id: null,
            status: 'Available'
        } as any);

        const result = await useCase.execute(lockerId, updateRequest);

        expect(mockLockerRepo.update).toHaveBeenCalledWith(lockerId, expect.objectContaining({
            member_id: null,
            status: 'Available'
        }));
        expect(result.status).toBe('Available');
    });

    it('5. Debe lanzar error si intenta asignar el casillero a un socio Suspendido', async () => {
        const lockerId = 'locker-123';
        const fakeMemberId = 'b916bb49-2fb0-45fa-ab44-3d07747e4eb1';
        
        const existingLocker = {
            id: lockerId, number: 10, status: 'Available', is_deleted: false, member_id: null
        };

        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce(existingLocker as any);
        // Simula que el socio está suspendido
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: fakeMemberId, status: 'Suspendido' } as any);
        
        vi.mocked(mockLockerValidator.validateMemberIsNotSuspended).mockImplementationOnce(() => {
            throw new Error('Un socio suspendido no puede alquilar o tener casilleros asignados');
        });

        await expect(useCase.execute(lockerId, { member_id: fakeMemberId }))
            .rejects.toThrow('Un socio suspendido');
        
        expect(mockLockerRepo.update).not.toHaveBeenCalled();
    });
});