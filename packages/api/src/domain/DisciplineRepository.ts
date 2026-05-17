import { Discipline, UpdateDiscipline } from '@alentapp/shared';

export interface DisciplineRepository {
  create(discipline: Omit<Discipline, 'id'>): Promise<Discipline>;

  update(id: string, data: UpdateDiscipline): Promise<Discipline>;
}