import { LockerDTO, UpdateLockerRequest } from '@alentapp/shared';

export interface LockerRepository {
    create(locker: Omit<LockerDTO, 'id' | 'is_deleted'>): Promise<LockerDTO>;
    
    findById(id: string): Promise<LockerDTO | null>;
    
    findByNumber(number: number): Promise<LockerDTO | null>;
    
    findAll(): Promise<LockerDTO[]>;
    
    update(id: string, data: UpdateLockerRequest): Promise<LockerDTO>;
    
    delete(id: string): Promise<void>; 
}