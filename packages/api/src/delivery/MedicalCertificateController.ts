import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { NewMedicalCertificateUseCase } from '../application/NewMedicalCertificateUseCase.js';
import { CreateMedicalCertificate } from '@alentapp/shared';

// Esquema de validación de entrada (Zod) - Paso 1 del flujo técnico
const createCertificateSchema = z.object({
  issue_date: z.string().min(1, "La fecha de emisión es obligatoria"),
  expiry_date: z.string().min(1, "La fecha de vencimiento es obligatoria"),
  doctor_license: z.string().min(1, "La matrícula del médico es obligatoria"),
  member_id: z.string().uuid("El ID del socio debe ser un UUID válido"),
});

export class MedicalCertificateController {
  constructor(
    private readonly newMedicalCertificateUseCase: NewMedicalCertificateUseCase
  ) {}

  // Método para crear un nuevo certificado médico - Paso 2 del flujo técnico
  async create(
    request: FastifyRequest<{ Body: CreateMedicalCertificate }>,
    reply: FastifyReply
  ) {
    try {
      // 1. Validar formato de datos con Zod
      const validatedData = createCertificateSchema.parse(request.body);

      // 2. Ejecutar Caso de Uso (Orquestación y Reglas de Negocio)
      const certificate = await this.newMedicalCertificateUseCase.execute(validatedData);

      // Escenario de éxito: 201 Created
      return reply.status(201).send({ data: certificate });

    } catch (error: any) {
      // Manejo de errores según Casos de Borde del TDD
      
      // Errores de Zod (400 Bad Request)
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: "Datos faltantes o inválidos", 
          // Detalles específicos de validación para facilitar la corrección por parte del cliente
          details: error.issues 
        });
      }

      // Socio inexistente (404 Not Found)
      if (error.message.includes('Socio inexistente')) {
        return reply.status(404).send({ error: error.message });
      }

      // Validaciones de fechas del Dominio (400 Bad Request)
      if (error.message.includes('vencimiento') || error.message.includes('emisión')) {
        return reply.status(400).send({ error: error.message });
      }

      // Error de Infraestructura / Genérico (500)
      request.log.error(error);
      return reply.status(500).send({ error: "Error interno, reintente más tarde" });
    }
  }
}