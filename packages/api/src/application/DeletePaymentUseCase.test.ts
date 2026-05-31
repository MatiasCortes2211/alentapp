import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeletePaymentUseCase } from './DeletePaymentUseCase.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentStatus } from '@alentapp/shared';

describe('DeletePaymentUseCase', () => {
    const mockPaymentRepo = {
        findById: vi.fn(),
        delete: vi.fn(),
    } as unknown as PaymentRepository;

    const useCase = new DeletePaymentUseCase(mockPaymentRepo);

    const validId = '123e4567-e89b-12d3-a456-426614174000';

    const mockPayment = {
        id: validId,
        amount: 5000,
        month: 6,
        year: 2026,
        due_date: '2027-06-30',
        status: PaymentStatus.Pending,
        payment_date: null,
        is_deleted: false,
        member_id: '123e4567-e89b-12d3-a456-426614174001',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe fallar si el id no tiene formato UUID válido', async () => {
        await expect(useCase.execute('id-invalido'))
            .rejects.toThrow('El formato del ID es inválido');
        expect(mockPaymentRepo.delete).not.toHaveBeenCalled();
    });

    it('debe fallar si el pago no existe', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(null);
        await expect(useCase.execute(validId))
            .rejects.toThrow('El pago ingresado no existe en el sistema');
        expect(mockPaymentRepo.delete).not.toHaveBeenCalled();
    });

    it('debe fallar si el pago ya fue eliminado', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce({
            ...mockPayment,
            is_deleted: true,
        } as any);
        await expect(useCase.execute(validId))
            .rejects.toThrow('El pago ya fue eliminado');
        expect(mockPaymentRepo.delete).not.toHaveBeenCalled();
    });

    it('debe eliminar el pago exitosamente si existe y no está eliminado', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(mockPayment as any);
        await useCase.execute(validId);
        expect(mockPaymentRepo.findById).toHaveBeenCalledWith(validId);
        expect(mockPaymentRepo.delete).toHaveBeenCalledWith(validId);
    });
});