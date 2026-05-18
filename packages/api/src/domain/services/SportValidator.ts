import { SportRepository } from '../SportRepository.js';

export class SportValidator {
    constructor(private readonly sportRepo: SportRepository) {}

    async validateNameIsUnique(name: string): Promise<void> {
        const sportWithSameName = await this.sportRepo.findByName(name);
        if (sportWithSameName && !sportWithSameName.is_deleted) {
            throw new Error('No pueden existir dos instancias de Sport con el mismo nombre.');
        }
    }

    async validateCanUpdateSport(id: string, newMaxCapacity?: number): Promise<void> {
        const sport = await this.sportRepo.findById(id);
        if (!sport || sport.is_deleted) {
            throw new Error('El deporte no existe.');
        }

        if (newMaxCapacity !== undefined) {
            const activeEnrollments = await this.sportRepo.countActiveEnrollments(id);
            if (activeEnrollments > newMaxCapacity) {
                throw new Error('max_capacity no puede ser menor a la cantidad de inscriptos activos.');
            }
        }
    }
}