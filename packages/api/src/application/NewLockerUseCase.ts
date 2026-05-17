import { ZodError } from 'zod';
import { CreateLockerSchema } from '../domain/services/LockerSchema.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { LockerDTO, CreateLockerRequest } from '@alentapp/shared';

export class CreateLockerUseCase {
    constructor(
        private readonly lockerRepository: LockerRepository,
        private readonly memberRepository: MemberRepository,
        private readonly lockerValidator: LockerValidator
    ) {}

    async execute(data: CreateLockerRequest): Promise<LockerDTO> {
        try {
            CreateLockerSchema.parse(data);
        } catch (error) {
            if (error instanceof ZodError) {
                throw new Error(error.issues[0].message);
            }
            throw error;
        }

        await this.lockerValidator.validateNumberIsUnique(data.number);

        if (data.member_id) {
            const member = await this.memberRepository.findById(data.member_id);
            if (!member) {
                throw new Error('El socio ingresado no existe');
            }

            if (data.status) {
                this.lockerValidator.validateStatusForAssignment(data.status);
            }
        }

        if (data.end_contract_date) {
            this.lockerValidator.validateEndContractDate(data.end_contract_date);
        }

        const finalStatus = data.member_id ? 'Occupied' : (data.status || 'Available');
        
        const nuevoLocker = await this.lockerRepository.create({
            number: data.number,
            location: data.location,
            status: finalStatus,
            end_contract_date: data.end_contract_date || null,
            member_id: data.member_id || null,
        });

        return nuevoLocker;
    }
}