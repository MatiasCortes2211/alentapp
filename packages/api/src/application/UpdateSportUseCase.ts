import { ZodError } from 'zod';
import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { UpdateSportSchema } from '../domain/services/SportSchema.js';
import { Sport, UpdateSport } from '@alentapp/shared';

export class UpdateSportUseCase {
    constructor(
        private readonly sportRepo: SportRepository,
        private readonly sportValidator: SportValidator
    ) {}

    async execute(id: string, data: UpdateSport): Promise<Sport> {
        try {
            UpdateSportSchema.parse(data);
        } catch (error) {
            if (error instanceof ZodError) {
                throw new Error(error.issues[0].message);
            }
            throw error;
        }

        await this.sportValidator.validateCanUpdateSport(id, data.max_capacity);
        
        return await this.sportRepo.update(id, data);
    }
}