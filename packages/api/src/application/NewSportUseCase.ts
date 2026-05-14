import { z, ZodError } from "zod";
import { SportRepository } from "../domain/SportRepository.js";
import {Sport, CreateSport } from "@alentapp/shared";

const CreateSportSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    max_capacity: z.number().int().positive({message: "max_capacity debe ser mayor a 0."}),
    additional_price: z.number().nonnegative(),
    requires_medical_certificate: z.boolean(),
});

export class CreateSportUseCase {
    constructor(
        private readonly sportRepository: SportRepository
    ) {}

    async execute(data: CreateSport): Promise<Sport> {
        try {
            CreateSportSchema.parse(data);
        } catch (error) {
            if (error instanceof ZodError) {
                throw new Error(error.issues[0].message);
            }
        }

        const deporteExistente = await this.sportRepository.findByName(data.name);
        if (deporteExistente && !deporteExistente.is_deleted) {
            throw new Error(`No pueden existir dos instancias de Sport con el mismo nombre.`);
        }

        const nuevoDeporte = await this.sportRepository.create({
            ...data,
            is_deleted: false,
        });

        return nuevoDeporte;
    }
}