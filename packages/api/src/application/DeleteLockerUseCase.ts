import { z, ZodError } from 'zod';
import { LockerRepository } from '../domain/LockerRepository.js';

export class DeleteLockerUseCase {
    constructor(private readonly lockerRepository: LockerRepository) {}

    async execute(id: string): Promise<void> {
        try {
            z.string().uuid({ message: "El formato del ID es inválido" }).parse(id);
        } catch (error) {
            if (error instanceof ZodError) throw new Error(error.issues[0].message);
            throw error;
        }

        const existingLocker = await this.lockerRepository.findById(id);
        if (!existingLocker) {
            throw new Error('El casillero no existe');
        }

        if (existingLocker.is_deleted) {
            throw new Error('El casillero ya fue eliminado previamente');
        }

        await this.lockerRepository.update(id, {
            is_deleted: true,
            status: 'Available',
            member_id: null,           // Libera al socio
            end_contract_date: null    // Limpia la fecha
        });
    }
}