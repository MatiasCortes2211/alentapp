import { ZodError } from 'zod';
import { CreatePaymentSchema } from '../domain/services/PaymentSchema.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js'; 
import { PaymentValidator } from '../domain/services/PaymentValidator.js'; 
import { PaymentDTO, CreatePaymentRequest, PaymentStatus } from '@alentapp/shared';

export class CreatePaymentUseCase {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly memberRepository: MemberRepository,
        private readonly paymentValidator: PaymentValidator
    ) {}

    async execute(data: CreatePaymentRequest): Promise<PaymentDTO> {

        
        try {
            CreatePaymentSchema.parse(data);
        } catch (error) {
            if (error instanceof ZodError) throw new Error(error.issues[0].message);
            throw error;
        }
        
        // 1. el miembro debe existir
        const member = await this.memberRepository.findById(data.member_id);
        if (!member) {
            throw new Error('El miembro ingresado no existe en el sistema');
        }

        // 2. Validaciones de negocio (centralizadas)
        this.paymentValidator.validateDueDate(data.due_date);
        await this.paymentValidator.validateNoDuplicateActivePayment(data.member_id, data.month, data.year);
        //usa await porque viaja a la BD para verificar si ya existe un pago activo

        // 3. Persistencia a través de la interfaz (sin saber qué DB es)
        const nuevoPago = await this.paymentRepository.create({
            ...data,
            status: PaymentStatus.Pending, // Regla de negocio: todos nacen en PENDING
            payment_date: null,            // Regla de negocio: fecha de pago vacía al crear
            is_deleted: false              // Regla de negocio: no nace eliminado
        });

        return nuevoPago;
    }
}