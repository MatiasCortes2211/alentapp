import { PaymentRepository } from '../domain/PaymentRepository.js';

export class DeletePaymentUseCase {
    constructor(private readonly paymentRepository: PaymentRepository) {}

    async execute(id: string): Promise<void> {
        // 1. Verificar existencia del pago
        const existingPayment = await this.paymentRepository.findById(id);
        if (!existingPayment) {
            throw new Error('El pago ingresado no existe en el sistema');
        }

        // 2. Verificar que no esté ya eliminado
        if (existingPayment.is_deleted) {
            throw new Error('El pago ya fue eliminado');
        }

        // 3. Eliminación lógica
        await this.paymentRepository.delete(id);
    }
}