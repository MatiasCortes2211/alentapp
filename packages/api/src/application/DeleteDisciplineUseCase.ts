import { DisciplineRepository } from "../domain/DisciplineRepository.js";

export class DeleteDisciplineUseCase {
    constructor(
        private readonly disciplineRepository: DisciplineRepository,
    ) {}

    async execute(id: string): Promise<void> {
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