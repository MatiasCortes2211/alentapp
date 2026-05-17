import { SportRepository } from '../domain/SportRepository.js';
import {Sport } from '@alentapp/shared';

export class GetSportsUseCase {
    constructor(private readonly sportRepo: SportRepository) {}

    async execute(): Promise<Sport[]> {
        return this.sportRepo.findAll();
    }
}
