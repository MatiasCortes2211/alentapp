import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdatePaymentUseCase } from './UpdatePaymentUseCase.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentValidator } from '../domain/services/PaymentValidator.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { PaymentStatus } from '@alentapp/shared';

describe('UpdatePaymentUseCase', () => {

    const mockPaymentRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as PaymentRepository;

    const mockPaymentValidator = {
        validateStatusTransition: vi.fn(),
        validateMemberIsNotSuspended: vi.fn(),
    } as unknown as PaymentValidator;

    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const useCase = new UpdatePaymentUseCase(mockPaymentRepo, mockPaymentValidator, mockMemberRepo);

    const validId = '123e4567-e89b-12d3-a456-426614174000';

    const mockPaymentPending = {
        id: validId,
        amount: 5000,
        month: 6,
        year: 2026,
        due_date: '2026-06-30',
        status: PaymentStatus.Pending,
        payment_date: null,
        is_deleted: false,
        member_id: '123e4567-e89b-12d3-a456-426614174001',
    };

    const mockMemberActivo = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        status: 'Activo',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(mockMemberRepo.findById).mockResolvedValue(mockMemberActivo as any);
    });

    it('debe fallar si el id no tiene formato UUID válido', async () => {
        await expect(useCase.execute('id-invalido', { status: PaymentStatus.Paid }))
            .rejects.toThrow('El formato del ID es inválido');
    });

    it('debe fallar si el pago no existe', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute(validId, { status: PaymentStatus.Paid }))
            .rejects.toThrow('El pago ingresado no existe en el sistema');

        expect(mockPaymentRepo.update).not.toHaveBeenCalled();
    });

    it('debe fallar si el pago está eliminado', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce({
            ...mockPaymentPending,
            is_deleted: true,
        } as any);

        await expect(useCase.execute(validId, { status: PaymentStatus.Paid }))
            .rejects.toThrow('Un pago no puede ser modificado si se encuentra eliminado');

        expect(mockPaymentRepo.update).not.toHaveBeenCalled();
    });

    it('debe fallar si el pago ya está en PAID o CANCELED', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce({
            ...mockPaymentPending,
            status: PaymentStatus.Paid, 
        } as any);
        vi.mocked(mockPaymentValidator.validateStatusTransition).mockImplementationOnce(() => {
            throw new Error('El pago ya se encuentra en estado PAID y no puede ser modificado');
        });

        await expect(useCase.execute(validId, { status: PaymentStatus.Paid }))
            .rejects.toThrow('El pago ya se encuentra en estado PAID y no puede ser modificado');

        expect(mockPaymentRepo.update).not.toHaveBeenCalled();
    });

    it('debe actualizar el pago a PAID exitosamente', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(mockPaymentPending as any);
        vi.mocked(mockPaymentRepo.update).mockResolvedValueOnce({
            ...mockPaymentPending,
            status: PaymentStatus.Paid,
            payment_date: new Date().toISOString(),
        } as any);

        const result = await useCase.execute(validId, { status: PaymentStatus.Paid });
        
        expect(mockPaymentRepo.findById).toHaveBeenCalledWith(validId);
        expect(mockPaymentValidator.validateMemberIsNotSuspended).toHaveBeenCalledWith(mockMemberActivo.status);
        expect(mockPaymentValidator.validateStatusTransition).toHaveBeenCalledWith(mockPaymentPending.status);
        expect(mockPaymentRepo.update).toHaveBeenCalledWith(validId, PaymentStatus.Paid);
        expect(result.status).toBe(PaymentStatus.Paid);
    });

    it('debe actualizar el pago a CANCELED exitosamente', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(mockPaymentPending as any);
        vi.mocked(mockPaymentRepo.update).mockResolvedValueOnce({
            ...mockPaymentPending,
            status: PaymentStatus.Canceled,
            payment_date: null,
        } as any);

        const result = await useCase.execute(validId, { status: PaymentStatus.Canceled });

        expect(mockPaymentRepo.findById).toHaveBeenCalledWith(validId);
        expect(mockPaymentValidator.validateMemberIsNotSuspended).toHaveBeenCalledWith(mockMemberActivo.status);
        expect(mockPaymentValidator.validateStatusTransition).toHaveBeenCalledWith(mockPaymentPending.status);
        expect(mockPaymentRepo.update).toHaveBeenCalledWith(validId, PaymentStatus.Canceled);
        expect(result.status).toBe(PaymentStatus.Canceled);
    });
});