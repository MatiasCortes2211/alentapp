import { z, ZodError } from "zod";
import { SportRepository } from "../domain/SportRepository.js";
import { SportValidator } from "../domain/services/SportValidator.js";
import {Sport, CreateSport } from "@alentapp/shared";

const CreateSportSchema = z.object({
    name: z.string().min(1, {message: "name es un campo requerido y no puede estar vacío."}),
    description: z.string().min(1, {message: "description es un campo requerido y no puede estar vacío."}),
    max_capacity: z.number().int().positive({message: "max_capacity debe ser mayor a 0."}),
    additional_price: z.number().nonnegative({message: "additional_price debe ser mayor a 0."}),
    requires_medical_certificate: z.boolean({message: "requires_medical_certificate debe ser un valor booleano válido."}),
});

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
        }

        await this.sportValidator.validateNameIsUnique(data.name); //Valida unicidad de nombre

        const nuevoDeporte = await this.sportRepository.create({
            ...data,
            is_deleted: false,
        });

        return nuevoDeporte;
    }
}