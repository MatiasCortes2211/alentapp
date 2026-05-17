import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentValidator } from '../domain/services/PaymentValidator.js';
import { PaymentDTO, PaymentStatus, UpdatePaymentRequest } from '@alentapp/shared';

export class UpdatePaymentUseCase {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly paymentValidator: PaymentValidator
    ) {}

    async execute(id: string, data: UpdatePaymentRequest): Promise<PaymentDTO> {

        // 1. El pago debe existir
        const existingPayment = await this.paymentRepository.findById(id);
        if (!existingPayment) {
            throw new Error('El pago ingresado no existe en el sistema');
        }

        // 2. Validaciones de negocio
        this.paymentValidator.validateStatusTransition(existingPayment.status);

        // 3. Persistencia a través de la interfaz
        return this.paymentRepository.update(id, data.status as PaymentStatus.Paid | PaymentStatus.Canceled);
    }
}