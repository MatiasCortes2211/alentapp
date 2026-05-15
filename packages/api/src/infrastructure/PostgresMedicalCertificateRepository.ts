import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateDTO, CreateMedicalCertificate } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

// definimos el tipo que representa la estructura de la tabla medical_certificate en la base de datos
type DBMedicalCertificate = {
    id: string;
    issue_date: Date;
    expiry_date: Date;
    doctor_license: string;
    member_id: string;
    is_validated: boolean;
    created_at: Date;
};

// Implementación de la interfaz MedicalCertificateRepository usando Prisma para interactuar con una base de datos PostgreSQL
export class PostgresMedicalCertificateRepository implements MedicalCertificateRepository {
    // Crea un nuevo certificado médico en la base de datos y devuelve su representación como DTO
    async create(data: CreateMedicalCertificate): Promise<MedicalCertificateDTO> {
        const certificate = await prisma.medicalCertificate.create({
            data: {
                // transformamos las fechas de string a Date para que Prisma pueda manejarlas correctamente
                issue_date: new Date(data.issue_date),
                expiry_date: new Date(data.expiry_date),
                doctor_license: data.doctor_license,
                member_id: data.member_id, 
                is_validated: true, // El nuevo siempre es el válido por defecto
            },
        });

        // Convertimos el resultado de la base de datos a un DTO para que el resto de la aplicación pueda usarlo sin depender de la estructura interna de la base de datos
        return this.mapToDTO(certificate as DBMedicalCertificate);
    }

    // Invalida los certificados anteriores de un miembro dado su ID, marcándolos como no validados en la base de datos
    async invalidatePriorCertificates(memberId: string): Promise<void> {
        // Actualizamos todos los certificados válidos del miembro a no válidos
        await prisma.medicalCertificate.updateMany({
            where: {
                member_id: memberId,
                is_validated: true,
            },
            data: {
                is_validated: false,
            },
        });
    }

    // Método privado para mapear la estructura de la base de datos a un DTO que la aplicación pueda usar sin depender de la estructura interna de la base de datos
    private mapToDTO(cert: DBMedicalCertificate): MedicalCertificateDTO {
        return {
            id: cert.id,
            issue_date: cert.issue_date.toISOString().split('T')[0],
            expiry_date: cert.expiry_date.toISOString().split('T')[0],
            doctor_license: cert.doctor_license,
            member_id: cert.member_id,
            is_validated: cert.is_validated
        };
    }
}