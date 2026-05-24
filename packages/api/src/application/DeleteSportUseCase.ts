import { ZodError } from 'zod';
import { SportRepository } from "../domain/SportRepository.js";
import { SportIdSchema } from '../domain/services/SportSchema.js';

export class DeleteSportUseCase {
    constructor(private readonly sportRepo: SportRepository) {}

    async execute(id: string): Promise<void> {
        try {
            SportIdSchema.parse(id);
        } catch (error) {
            if (error instanceof ZodError) {
                throw new Error(error.issues[0].message);
            }   
            throw error;
        }

        const existingSport = await this.sportRepo.findById(id);
        if (!existingSport) {
            throw new Error('El deporte no existe.');
        }
        if (existingSport.is_deleted) {
            throw new Error('El deporte ya está eliminado.');
        }

        await this.sportRepo.delete(id);
    }   
}