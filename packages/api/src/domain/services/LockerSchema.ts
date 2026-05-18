import { z } from 'zod';

const CreateLockerSchema = z.object({
    number: z.number().int().positive({ message: "El número de casillero debe ser mayor a 0" }),
    location: z.enum(['Male', 'Female', 'Kids']),
    status: z.enum(['Available', 'Occupied', 'Maintenance']).optional(),
    end_contract_date: z.string().datetime().nullable().optional(),
    member_id: z.string().uuid({ message: "El ID del socio debe ser un UUID válido" }).nullable().optional(),
});

const UpdateLockerSchema = z.object({
    number: z.number().int().positive({ message: "El número de casillero debe ser mayor a 0" }).optional(),
    location: z.enum(['Male', 'Female', 'Kids']).optional(),
    status: z.enum(['Available', 'Occupied', 'Maintenance']).optional(),
    end_contract_date: z.string().datetime().nullable().optional(),
    member_id: z.string().uuid({ message: "El ID del socio debe ser un UUID válido" }).nullable().optional(),
});

export { CreateLockerSchema, UpdateLockerSchema };