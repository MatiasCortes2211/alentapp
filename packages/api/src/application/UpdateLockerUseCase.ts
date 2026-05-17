import { ZodError } from 'zod';
import { UpdateLockerSchema } from '../domain/services/LockerSchema.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { LockerDTO, UpdateLockerRequest } from '@alentapp/shared';

export class UpdateLockerUseCase {
    constructor(
        private readonly lockerRepository: LockerRepository,
        private readonly memberRepository: MemberRepository,
        private readonly lockerValidator: LockerValidator
    ) {}

    async execute(id: string, data: UpdateLockerRequest): Promise<LockerDTO> {
        try {
            UpdateLockerSchema.parse(data);
        } catch (error) {
            if (error instanceof ZodError) throw new Error(error.issues[0].message);
            throw error;
        }

        const existingLocker = await this.lockerRepository.findById(id);
        if (!existingLocker || existingLocker.is_deleted) {
            throw new Error('El casillero no existe');
        }

        if (data.number && data.number !== existingLocker.number) {
            await this.lockerValidator.validateNumberIsUnique(data.number, id);
        }

        const finalMemberId = data.member_id !== undefined ? data.member_id : existingLocker.member_id;
        const finalEndDate = data.end_contract_date !== undefined ? data.end_contract_date : existingLocker.end_contract_date;
        
        this.lockerValidator.validateAssignmentIntegrity(finalMemberId, finalEndDate);

        if (data.end_contract_date) {
            this.lockerValidator.validateEndContractDate(data.end_contract_date);
        }
        if (data.member_id) {
            const member = await this.memberRepository.findById(data.member_id);
            if (!member) throw new Error('El socio ingresado no existe');
        }

        let finalStatus = data.status !== undefined ? data.status : existingLocker.status;
        if (finalMemberId && !existingLocker.member_id) {
            this.lockerValidator.validateStatusForAssignment(finalStatus);
        }

        if (finalMemberId) {
            finalStatus = 'Occupied'; // Siempre que haya socio, se fuerza a Ocupado
        } else {
            // Si el casillero se quedó sin socio pero su estado no fue cambiado, se fuerza a Disponible.
            if (finalStatus === 'Occupied') {
                finalStatus = 'Available'; 
            }
        }

        return this.lockerRepository.update(id, {
            ...data,
            status: finalStatus
        });
    }
}