import { Sport } from '@alentapp/shared';

export interface SportRepository {
    create(sport: Omit<Sport, 'id'>): Promise<Sport>;
    findByName(name: string): Promise<Sport | null>;
    findAll(): Promise<Sport[]>;
    findById(id: string): Promise<Sport | null>;
    update(id: string, data: Partial<Pick<Sport, 'description' | 'max_capacity'>>): Promise<Sport>;
    countActiveEnrollments(sportId: string): Promise<number>;
    delete(id: string): Promise<void>;
}