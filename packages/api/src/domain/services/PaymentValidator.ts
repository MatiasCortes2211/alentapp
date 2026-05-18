import { PaymentRepository } from '../PaymentRepository.js';

export class PaymentValidator {
    constructor(private readonly paymentRepo: PaymentRepository) {}

    validateDueDate(dueDate: string | Date): void {
        const due = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Para comparar solo el día

        if (due < today) {
            throw new Error('La fecha de vencimiento no puede ser anterior a hoy');
        }
    }

    async validateNoDuplicateActivePayment(memberId: string, month: number, year: number): Promise<void> {
        const existingPayment = await this.paymentRepo.findActiveByMemberMonthYear(memberId, month, year);
        
        if (existingPayment) {
            throw new Error('Ya existe un pago activo para este socio en el mismo mes y año');
        }
    }

    validateStatusTransition(currentStatus: string): void {
    if (currentStatus === 'PAID' || currentStatus === 'CANCELED') {
        throw new Error(
            `El pago ya se encuentra en estado ${currentStatus} y no puede ser modificado`
        );
    }
}
}