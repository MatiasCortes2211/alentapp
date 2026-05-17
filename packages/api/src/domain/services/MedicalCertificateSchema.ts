import { z } from 'zod';

const CreateMedicalCertificateSchema = z.object({
  issue_date: z.string().min(1, { message: "La fecha de emisión es obligatoria" }),
  expiry_date: z.string().min(1, { message: "La fecha de vencimiento es obligatoria" }),
  doctor_license: z.string().min(1, { message: "La matrícula del médico es obligatoria" }),
  member_id: z.string().uuid({ message: "El ID del socio debe ser un UUID válido" }),
});

export { CreateMedicalCertificateSchema };