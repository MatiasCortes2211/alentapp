import { Discipline } from '@alentapp/shared';

export interface DisciplineRepository {
  create(discipline: Omit<Discipline, 'id'>): Promise<Discipline>;
}