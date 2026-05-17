import { ZodError } from "zod";
import { CreateSportSchema } from "../domain/services/SportSchema.js";
import { SportRepository } from "../domain/SportRepository.js";
import { SportValidator } from "../domain/services/SportValidator.js";
import {Sport, CreateSport } from "@alentapp/shared";

export class CreateSportUseCase {
    constructor(
        private readonly sportRepository: SportRepository,
        private readonly sportValidator: SportValidator
    ) {}

    async execute(data: CreateSport): Promise<Sport> {
        try {
            CreateSportSchema.parse(data);
        } catch (error) {
            if (error instanceof ZodError) {
                throw new Error(error.issues[0].message);
            }
            throw error;
        }

        await this.sportValidator.validateNameIsUnique(data.name); //Valida unicidad de nombre

        const nuevoDeporte = await this.sportRepository.create({
            ...data,
            is_deleted: false,
        });

        return nuevoDeporte;
    }
}