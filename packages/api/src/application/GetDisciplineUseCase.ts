import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { Discipline } from '@alentapp/shared';

export class GetDisciplineUseCase {
    constructor(private readonly disciplineRepo: DisciplineRepository) {}

    async execute(): Promise<Discipline[]> {
        return this.disciplineRepo.findAll();
    }
}