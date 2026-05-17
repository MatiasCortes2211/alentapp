import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerDTO } from '@alentapp/shared';

export class GetLockersUseCase {
    constructor(private readonly lockerRepo: LockerRepository) {}

    async execute(): Promise<LockerDTO[]> {
        return this.lockerRepo.findAll();
    }
}