import { z } from 'zod';

const CreateDisciplineSchema = z.object({
    reason: z.string().min(1, {message: "Razón es un campo requerido y no puede estar vacío."}).max(40, {message: "Razón no puede tener más de 40 caracteres."}),
    start_date: z.string().min(1, {message: "La fecha de inicio es obligatoria"}),
    end_date: z.string().min(1, {message: "La fecha de fin es obligatoria"}),
    is_total_suspension: z.boolean({message: "Es suspensión Total debe ser un booleano"}),
    member_id: z.string().uuid({message: "ID de miembro inválido."}),
});

const UpdateDisciplineSchema = z.object({
    reason: z.string().min(1, {message: "Razón es un campo requerido y no puede estar vacío."}).optional(),
    start_date: z.string().min(1, {message: "La fecha de inicio es obligatoria"}).optional(),
    end_date: z.string().min(1, {message: "La fecha de fin es obligatoria"}).optional(),
    is_total_suspension: z.boolean({message: "Es suspensión Total debe ser un booleano"}).optional(),
    member_id: z.string().uuid({message: "El id del socio debe ser un UUID válido"}).optional(),
});
export { CreateDisciplineSchema, UpdateDisciplineSchema };