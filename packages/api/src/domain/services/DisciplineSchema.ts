import { z } from 'zod';

const CreateDisciplineSchema = z.object({
    reason: z.string().min(1, {message: "Razón es un campo requerido y no puede estar vacío."}),
    start_date: z.string().min(1, {message: "La fecha de inicio es obligatoria"}),
    end_date: z.string().min(1, {message: "La fecha de fin es obligatoria"}),
    is_total_suspension: z.boolean({message: "Es suspensión Total debe ser un booleano"})
});

export { CreateDisciplineSchema };