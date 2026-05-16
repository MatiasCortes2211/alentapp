import { PaymentRepository } from '../PaymentRepository.js';

export class PaymentValidator {
    constructor(private readonly paymentRepo: PaymentRepository) {}

    validateAmount(amount: number): void {
        if (amount <= 0) {
            throw new Error('El monto debe ser mayor a cero');
        }
    }

    validateMonth(month: number): void {
        if (month < 1 || month > 12) {
            throw new Error('El mes debe estar entre 1 y 12');
        }
    }

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

    validateRequiredFields(body: any): void {
        const requiredFields = ['member_id', 'amount', 'month', 'year', 'due_date'];
        
        for (const field of requiredFields) {
            if (body[field] === undefined || body[field] === null || body[field] === '') {
                throw new Error(`El campo es requerido`);
            }
        }
    }
}