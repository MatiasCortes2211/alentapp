import { z } from 'zod';

const CreateDisciplineSchema = z.object({
    reason: z.string({message: "Razón es un campo requerido y no puede estar vacío."}).min(1, {message: "Razón es un campo requerido y no puede estar vacío."}).max(40, {message: "Razón no puede tener más de 40 caracteres."}),
    start_date: z.string({message: "La fecha de inicio es obligatoria"}).min(1, {message: "La fecha de inicio es obligatoria"}),
    end_date: z.string({message: "La fecha de fin es obligatoria"}).min(1, {message: "La fecha de fin es obligatoria"}),
    is_total_suspension: z.boolean({message: "Es suspensión Total es obligatorio y debe ser un booleano"}),
    member_id: z.string({message: "ID de miembro es un campo obligatorio"}).uuid({message: "ID de miembro inválido."}),
});

const UpdateDisciplineSchema = z.object({
    reason: z.string().min(1, {message: "Razón no puede estar vacía."}).optional(),
    start_date: z.string().min(1, {message: "La fecha de inicio no puede estar vacía"}).optional(),
    end_date: z.string().min(1, {message: "La fecha de fin no puede estar vacía"}).optional(),
    is_total_suspension: z.boolean({message: "Es suspensión Total no puede estar vacío y debe ser un booleano"}).optional(),
    member_id: z.string().uuid({message: "ID de miembro vacío o inválido"}).optional(),
});

const DisciplineIdSchema = z.string().uuid({message: "ID de disciplina inválido"});

export { CreateDisciplineSchema, UpdateDisciplineSchema, DisciplineIdSchema };