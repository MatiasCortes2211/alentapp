import { Discipline, UpdateDiscipline } from '@alentapp/shared';

export interface DisciplineRepository {
  create(discipline: Omit<Discipline, 'id'>): Promise<Discipline>;

  findAll(): Promise<Discipline[]>;

  delete(id: string): Promise<void>;

  findById(id: string): Promise<Discipline | null>;

  update(id: string, data: UpdateDiscipline): Promise<Discipline>;
}