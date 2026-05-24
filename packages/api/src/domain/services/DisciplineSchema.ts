import { z } from 'zod';

const CreateDisciplineSchema = z.object({
    reason: z.string().min(1, {message: "Razón es un campo requerido y no puede estar vacío."}),
    start_date: z.string().min(1, {message: "La fecha de inicio es obligatoria"}),
    end_date: z.string().min(1, {message: "La fecha de fin es obligatoria"}),
    is_total_suspension: z.boolean({message: "Es suspensión Total debe ser un booleano"})
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