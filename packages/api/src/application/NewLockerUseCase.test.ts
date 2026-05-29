import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateLockerUseCase } from './NewLockerUseCase.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { CreateLockerRequest } from '@alentapp/shared';

describe('CreateLockerUseCase', () => {
    const mockLockerRepo = {
        create: vi.fn(),
    } as unknown as LockerRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const mockLockerValidator = {
        validateAssignmentIntegrity: vi.fn(),
        validateMaxCapacity: vi.fn(),
        validateNumberIsUnique: vi.fn(),
        validateMemberIsNotSuspended: vi.fn(),
        validateStatusForAssignment: vi.fn(),
        validateEndContractDate: vi.fn(),
    } as unknown as LockerValidator;

    const useCase = new CreateLockerUseCase(mockLockerRepo, mockMemberRepo, mockLockerValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('1. Debe crear un casillero exitosamente sin socio asignado (Estado Available)', async () => {
        const mockRequest: CreateLockerRequest = {
            number: 15,
            location: 'Male',
        };

        vi.mocked(mockLockerRepo.create).mockResolvedValueOnce({
            id: 'locker-123',
            number: 15,
            location: 'Male',
            status: 'Available',
            end_contract_date: null,
            member_id: null,
            is_deleted: false
        });

        const result = await useCase.execute(mockRequest);

        expect(mockLockerRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            number: 15,
            status: 'Available'
        }));
        expect(result.id).toBe('locker-123');
    });

    it('2. Debe forzar el estado a Occupied si se asigna un socio en la creación', async () => {
        const fakeUUID = 'b916bb49-2fb0-45fa-ab44-3d07747e4eb1';

        const mockRequest: CreateLockerRequest = {
            number: 20,
            location: 'Female',
            status: 'Available',
            member_id: fakeUUID,
            end_contract_date: '2027-01-01T00:00:00.000Z'
        };

        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: fakeUUID, status: 'Activo' } as any);

        vi.mocked(mockLockerRepo.create).mockResolvedValueOnce({
            id: 'locker-456',
            number: 20,
            location: 'Female',
            status: 'Occupied',
            end_contract_date: '2027-01-01T00:00:00.000Z',
            member_id: fakeUUID,
            is_deleted: false
        });

        const result = await useCase.execute(mockRequest);

        expect(mockLockerRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            status: 'Occupied',
            member_id: fakeUUID
        }));
        expect(result.status).toBe('Occupied');
    });

    it('3. Debe lanzar error si el socio asignado no existe en la base de datos', async () => {
        const fakeUUID = 'a123bc45-6de7-89fa-bc01-23456789def0';

        const mockRequest: CreateLockerRequest = {
            number: 25,
            location: 'Male',
            member_id: fakeUUID,
            end_contract_date: '2027-01-01T00:00:00.000Z'
        };

        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute(mockRequest)).rejects.toThrow('El socio ingresado no existe');
        
        expect(mockLockerRepo.create).not.toHaveBeenCalled();
    });

    it('4. Debe lanzar error si se alcanzó el límite de 100 casilleros', async () => {
        const mockRequest: CreateLockerRequest = { number: 101, location: 'Male' };

        vi.mocked(mockLockerValidator.validateMaxCapacity).mockRejectedValueOnce(
            new Error('Se ha alcanzado el límite máximo de 100 casilleros activos en el club')
        );

        await expect(useCase.execute(mockRequest)).rejects.toThrow('límite máximo');
        expect(mockLockerRepo.create).not.toHaveBeenCalled();
    });
});