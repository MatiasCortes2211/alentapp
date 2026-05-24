import { ZodError } from 'zod';
import { UpdatePaymentSchema, PaymentIdSchema } from '../domain/services/PaymentSchema.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentValidator } from '../domain/services/PaymentValidator.js';
import { PaymentDTO, PaymentStatus, UpdatePaymentRequest } from '@alentapp/shared';
import { MemberRepository } from '../domain/MemberRepository.js';

export class UpdatePaymentUseCase {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly paymentValidator: PaymentValidator,
        private readonly memberRepository: MemberRepository
    ) {}

    async execute(id: string, data: UpdatePaymentRequest): Promise<PaymentDTO> {

        try {
            PaymentIdSchema.parse(id);
        } catch (error) {
            if (error instanceof ZodError) throw new Error(error.issues[0].message);
            throw error;
        }

        try {
            UpdatePaymentSchema.parse(data);
        } catch (error) {
            if (error instanceof ZodError) throw new Error(error.issues[0].message);
            throw error;
        }

        // 1. El pago debe existir
        const existingPayment = await this.paymentRepository.findById(id);
        if (!existingPayment) {
            throw new Error('El pago ingresado no existe en el sistema');
        }

        const member = await this.memberRepository.findById(existingPayment.member_id);
        this.paymentValidator.validateMemberIsNotSuspended(member.status);

        // 2. Verificar que no este ya eliminado
        if (existingPayment.is_deleted) {
            throw new Error('Un pago no puede ser modificado si se encuentra eliminado');
        }

        // 3. Validaciones de negocio
        this.paymentValidator.validateStatusTransition(existingPayment.status);

        // 4. Persistencia a través de la interfaz
        return this.paymentRepository.update(id, data.status as PaymentStatus.Paid | PaymentStatus.Canceled);
    }
}