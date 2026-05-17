import { SportRepository } from '../SportRepository.js';

export class SportValidator {
    constructor(private readonly sportRepo: SportRepository) {}

    async validateNameIsUnique(name: string): Promise<void> {
        const sportWithSameName = await this.sportRepo.findByName(name);
        if (sportWithSameName && !sportWithSameName.is_deleted) {
            throw new Error('No pueden existir dos instancias de Sport con el mismo nombre.');
        }
    }
}