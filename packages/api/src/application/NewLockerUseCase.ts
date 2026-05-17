import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { LockerDTO, CreateLockerRequest } from '@alentapp/shared';

export class CreateLockerUseCase {
    constructor(
        private readonly lockerRepository: LockerRepository,
        private readonly lockerValidator: LockerValidator
    ) {}

    async execute(data: CreateLockerRequest): Promise<LockerDTO> {
        await this.lockerValidator.validateNumberIsUnique(data.number);

        if (data.member_id && data.status) {
            this.lockerValidator.validateStatusForAssignment(data.status);
        }

        const nuevoLocker = await this.lockerRepository.create({
            number: data.number,
            location: data.location,
            status: data.status || 'Available',
            end_contract_date: data.end_contract_date || null,
            member_id: data.member_id || null,
        });

        return nuevoLocker;
    }
}