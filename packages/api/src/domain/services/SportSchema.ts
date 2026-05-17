import { z } from 'zod';

const CreateSportSchema = z.object({
    name: z.string().min(1, {message: "name es un campo requerido y no puede estar vacío."}),
    description: z.string().min(1, {message: "description es un campo requerido y no puede estar vacío."}),
    max_capacity: z.number().int().positive({message: "max_capacity debe ser mayor a 0."}),
    additional_price: z.number().nonnegative({message: "additional_price debe ser mayor o igual a 0."}),
    requires_medical_certificate: z.boolean({message: "requires_medical_certificate debe ser un valor booleano válido."}),
});

export { CreateSportSchema };