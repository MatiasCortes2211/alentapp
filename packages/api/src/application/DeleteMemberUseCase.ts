import { MemberRepository } from '../domain/MemberRepository.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';

export class DeleteMemberUseCase {
    constructor(
        private readonly memberRepo: MemberRepository, 
        private readonly paymentRepo: PaymentRepository
    ) {}

    async execute(id: string): Promise<void> {
        // Validar existencia del miembro
        const existingMember = await this.memberRepo.findById(id);
        if (!existingMember) {
            throw new Error('El miembro no existe');
        }

        // Eliminar pagos asociados
        await this.paymentRepo.softDeleteByMemberId(id);

        // Ejecutar eliminación
        await this.memberRepo.delete(id);
    }
}
