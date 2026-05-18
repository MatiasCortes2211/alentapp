import { z } from 'zod';

const CreatePaymentSchema = z.object({
    amount: z.number().positive({ message: "El monto debe ser mayor a cero" }),
    month: z.number().int().min(1, { message: "El mes debe estar entre 1 y 12" }).max(12, { message: "El mes debe estar entre 1 y 12" }),
    year: z.number().int().min(2024, { message: "El año debe ser mayor o igual a 2024" }),
    due_date: z.string().min(1, { message: "La fecha de vencimiento es requerida" }),
    member_id: z.string().uuid({ message: "El ID del socio debe ser un UUID válido" }),
});

const UpdatePaymentSchema = z.object({
    status: z.enum(['PAID', 'CANCELED'], { message: "El estado debe ser PAID o CANCELED" }),
});

export { CreatePaymentSchema, UpdatePaymentSchema };