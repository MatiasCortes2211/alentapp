import { z } from 'zod';

export const CreateSportSchema = z.object({
    name: z.string({message: "El nombre es obligatorio."}).min(1, {message: "El nombre no puede estar vacío."}),
    description: z.string({message: "La descripción es obligatoria."}).min(1, {message: "La descripción no puede estar vacía."}),
    max_capacity: z.number({message: "La capacidad máxima es obligatoria."}).int().positive({message: "La capacidad máxima debe ser mayor a 0."}),
    additional_price: z.number({message: "El precio adicional es obligatorio."}).nonnegative({message: "El precio adicional debe ser mayor o igual a $0."}),
    requires_medical_certificate: z.boolean({message: "El requisito de certificado médico es obligatorio."}),
});

export const UpdateSportSchema = z.object({
    description: z.string().min(1, {message: "La descripción no puede estar vacía."}).optional(),
    max_capacity: z.number().int().positive({message: "La capacidad máxima debe ser mayor a 0."}).optional(),
}).strict();

export const SportIdSchema = z.string({message: "El ID es obligatorio."}).uuid({message: "ID inválido."});