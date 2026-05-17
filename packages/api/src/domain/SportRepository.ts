import { Sport } from '@alentapp/shared';

export interface SportRepository {
    create(sport: Omit<Sport, 'id'>): Promise<Sport>;
    findByName(name: string): Promise<Sport | null>; // Agrega método para buscar por nombre. Permite evitar duplicados.
    findAll(): Promise<Sport[]>;
}