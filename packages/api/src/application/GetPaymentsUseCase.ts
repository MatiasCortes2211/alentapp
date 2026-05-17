import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentDTO } from '@alentapp/shared';

export class GetPaymentsUseCase {
    constructor(
        private readonly paymentRepository: PaymentRepository,
    ) {}

    async execute(): Promise<PaymentDTO[]> {
        return await this.paymentRepository.findAll();
    }
}