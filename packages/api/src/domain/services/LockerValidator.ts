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
        if (status !== 'Available') {
            throw new Error('Un casillero solo puede ser asignado si su estado es Disponible');
        }
    }

    validateEndContractDate(dateString: string): void {
        const endDate = new Date(dateString);
        const now = new Date();
        
        if (endDate <= now) {
            throw new Error('La fecha de fin de contrato debe ser mayor a la fecha actual');
        }
    }

    validateAssignmentIntegrity(memberId?: string | null, endDate?: string | null): void {
        const hasMember = !!memberId; // true si hay un ID, false si es null o vacío
        const hasDate = !!endDate;    // true si hay fecha, false si es null o vacío

        if (hasMember !== hasDate) {
            throw new Error('Para asignar un casillero, debe ingresar tanto el socio como la fecha de fin de contrato conjuntamente');
        }
    }
}