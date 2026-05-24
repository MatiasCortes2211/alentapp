import { z } from 'zod';

const CreatePaymentSchema = z.object({
    amount: z.number({  message: "El monto es obligatorio y debe ser un número" 
    }).positive({ message: "El monto debe ser mayor a cero" }),
    month: z.number({ message: "El mes es obligatorio y debe ser un número" }).int().min(1, { message: "El mes debe estar entre 1 y 12" }).max(12, { message: "El mes debe estar entre 1 y 12" }),
    year: z.number({ message: "El año es obligatorio y debe ser un número" }).int().min(2024, { message: "El año debe ser mayor o igual a 2024" }),
    due_date: z.string({ message: "La fecha de vencimiento es obligatoria" }).min(1, { message: "La fecha de vencimiento es requerida" }),
    member_id: z.string({ message: "El ID del socio es obligatorio" }).uuid({ message: "El ID del socio debe ser un UUID válido" }),
});

const UpdatePaymentSchema = z.object({
    status: z.enum(['PAID', 'CANCELED'], { message: "El estado debe ser PAID o CANCELED" }),
});

const PaymentIdSchema = z.string().uuid({ message: "El formato del ID es inválido" });

export { CreatePaymentSchema, UpdatePaymentSchema, PaymentIdSchema };