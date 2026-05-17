import { Discipline } from '@alentapp/shared';

export interface DisciplineRepository {
  create(discipline: Omit<Discipline, 'id'>): Promise<Discipline>;

  delete(id: string): Promise<void>;

  findById(id: string): Promise<Discipline | null>;
}