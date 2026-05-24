import { z } from 'zod';

export const CreateSportSchema = z.object({
    name: z.string().min(1, {message: "El nombre no puede estar vacío."}),
    description: z.string().min(1, {message: "La descripción no puede estar vacía."}),
    max_capacity: z.number().int().positive({message: "La capacidad máxima debe ser mayor a 0."}),
    additional_price: z.number().nonnegative({message: "El precio adicional debe ser mayor o igual a $0."}),
    requires_medical_certificate: z.boolean({message: "El requisito de certificado médico debe ser un valor booleano válido."}),
});

export const UpdateSportSchema = z.object({
    description: z.string().min(1, {message: "La descripción no puede estar vacía."}).optional(),
    max_capacity: z.number().int().positive({message: "La capacidad máxima debe ser mayor a 0."}).optional(),
});

export const SportIdSchema = z.string().uuid({message: "ID inválido."});