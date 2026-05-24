import { SportRepository } from '../SportRepository.js';

export class SportValidator {
    constructor(private readonly sportRepo: SportRepository) {}

    async validateNameIsUnique(name: string): Promise<void> {
        const sportWithSameName = await this.sportRepo.findByName(name);
        if (sportWithSameName) {
            throw new Error('Ya existe un deporte con ese nombre.');
        }
    }

    async validateCanUpdateSport(id: string, newMaxCapacity?: number): Promise<void> {
        if (newMaxCapacity !== undefined) {
            const activeEnrollments = await this.sportRepo.countActiveEnrollments(id);
            if (activeEnrollments > newMaxCapacity) {
                throw new Error('La capacidad máxima no puede ser menor a la cantidad de inscriptos activos.');
            }
        }
    }
}