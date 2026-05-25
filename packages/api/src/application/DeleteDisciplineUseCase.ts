import { ZodError } from "zod";
import { DisciplineRepository } from "../domain/DisciplineRepository.js";
import { DisciplineIdSchema } from "../domain/services/DisciplineSchema.js";

export class DeleteDisciplineUseCase {
    constructor(
        private readonly disciplineRepository: DisciplineRepository,
    ) {}

    async execute(id: string): Promise<void> {
        try {
            DisciplineIdSchema.parse(id);
        } catch (error) {
            if (error instanceof ZodError) {
                throw new Error(error.issues[0].message);
            }   
            throw error;
        }

        const discipline = await this.disciplineRepository.findById(id);
        if (!discipline) {
            throw new Error('La disciplina no existe');
        }
        if (discipline.is_deleted) {
            throw new Error('La disciplina ya fue eliminada');
        }

        await this.disciplineRepository.delete(id);
    }
}