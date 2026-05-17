import { LockerRepository } from '../LockerRepository.js';
import { LockerStatus } from '@alentapp/shared';

export class LockerValidator {
    constructor(private readonly lockerRepo: LockerRepository) {}

    async validateNumberIsUnique(number: number, excludeLockerId?: string): Promise<void> {
        const lockerWithSameNumber = await this.lockerRepo.findByNumber(number);
        
        if (lockerWithSameNumber && !lockerWithSameNumber.is_deleted && lockerWithSameNumber.id !== excludeLockerId) {
            throw new Error('Ya existe un casillero activo con ese número');
        }
    }

    validateStatusForAssignment(status: LockerStatus): void {
        if (status === 'Maintenance') {
            throw new Error('Un casillero en mantenimiento no puede ser asignado');
        }
    }
}