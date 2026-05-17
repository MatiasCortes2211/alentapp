import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { LockerDTO, CreateLockerRequest } from '@alentapp/shared';
import { z } from 'zod';

const createLockerSchema = z.object({
    number: z.number().int().positive("El número de casillero debe ser mayor a 0"),
    location: z.enum(['Male', 'Female', 'Kids']),
    status: z.enum(['Available', 'Occupied', 'Maintenance']).optional(),
    end_contract_date: z.string().datetime().nullable().optional(),
    member_id: z.string().uuid().nullable().optional(),
});

export class CreateLockerUseCase {
    constructor(
        private readonly lockerRepository: LockerRepository,
        private readonly lockerValidator: LockerValidator
    ) {}

    async execute(data: CreateLockerRequest): Promise<LockerDTO> {
        const validatedData = createLockerSchema.parse(data);

        await this.lockerValidator.validateNumberIsUnique(validatedData.number);

        if (validatedData.member_id && validatedData.status) {
            this.lockerValidator.validateStatusForAssignment(validatedData.status);
        }

        const nuevoLocker = await this.lockerRepository.create({
            number: validatedData.number,
            location: validatedData.location,
            status: validatedData.status || 'Available',
            end_contract_date: validatedData.end_contract_date || null,
            member_id: validatedData.member_id || null,
        });

        return nuevoLocker;
    }
}