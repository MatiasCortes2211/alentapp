import { z } from "zod";
import { SportRepository } from "../domain/SportRepository.js";
import {Sport, CreateSport } from "@alentapp/shared";

const CreateSportSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    max_capacity: z.number().int().positive({message: "max_capacity debe ser mayor a cero "}),
    additional_price: z.number().nonnegative(),
    requires_medical_certificate: z.boolean(),
});

export class CreateSportUseCase {
    constructor(
        private readonly sportRepository: SportRepository
    ) {}

    async execute(data: CreateSport): Promise<Sport> {
        CreateSportSchema.parse(data);

        const deporteExistente = await this.sportRepository.findByName(data.name);
        if (deporteExistente && !deporteExistente.is_deleted) {
            throw new Error(`El deporte con nombre "${data.name}" ya existe.`);
        }

        const nuevoDeporte = await this.sportRepository.create({
            ...data,
            is_deleted: false,
        });

        return nuevoDeporte;
    }
}