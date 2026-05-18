import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateDTO, CreateMedicalCertificate, UpdateMedicalCertificate } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBMedicalCertificate = {
    id: string;
    issue_date: Date;
    expiry_date: Date;
    doctor_license: string;
    member_id: string;
    is_validated: boolean;
    created_at: Date;
};

export class PostgresMedicalCertificateRepository implements MedicalCertificateRepository {
    
    // 1. Crear Certificado (Paula / TDD-0007)
    async create(data: CreateMedicalCertificate): Promise<MedicalCertificateDTO> {
        const certificate = await prisma.medicalCertificate.create({
            data: {
                issue_date: new Date(data.issue_date),
                expiry_date: new Date(data.expiry_date),
                doctor_license: data.doctor_license,
                member_id: data.member_id, 
                is_validated: true,
            },
        });
        return this.mapToDTO(certificate as DBMedicalCertificate);
    }

    // 2. Invalidar Anteriores (Paula / TDD-0007)
    async invalidatePriorCertificates(memberId: string): Promise<void> {
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

    // 3. Buscar por ID de Socio (Paula / TDD-0007)
    async findByMemberId(memberId: string): Promise<MedicalCertificateDTO[]> {
        const certificates = await prisma.medicalCertificate.findMany({
            where: {
                member_id: memberId,
            },
            orderBy: {
                issue_date: 'desc',
            },
        });
        return certificates.map(cert => this.mapToDTO(cert as DBMedicalCertificate));
    }

    // 4. Buscar por ID único (Tu Update de Main - TDD-0008)
    async findById(id: string): Promise<MedicalCertificateDTO | null> {
        const certificate = await prisma.medicalCertificate.findUnique({
            where: { id },
        });
        if (!certificate) return null;
        return this.mapToDTO(certificate as DBMedicalCertificate);
    }

    // 5. Actualizar campos parciales (Tu Update de Main - TDD-0008)
    async update(id: string, data: UpdateMedicalCertificate): Promise<MedicalCertificateDTO> {
        const updateData: any = {};

        if (data.is_validated !== undefined) updateData.is_validated = data.is_validated;
        if (data.doctor_license !== undefined) updateData.doctor_license = data.doctor_license;
        if (data.issue_date !== undefined) updateData.issue_date = new Date(data.issue_date);
        if (data.expiry_date !== undefined) updateData.expiry_date = new Date(data.expiry_date);

        const updatedCertificate = await prisma.medicalCertificate.update({
            where: { id },
            data: updateData,
        });

        return this.mapToDTO(updatedCertificate as DBMedicalCertificate);
    }

    // =========================================================================
    // 🚀 6. BAJA FISICA EN POSTGRESQL (TDD-0009)
    // =========================================================================
    async delete(id: string): Promise<void> {
        await prisma.medicalCertificate.delete({
            where: { id },
        });
    }

    // ✅ UNA SOLA COPIA LIMPIA DE MAP_TO_DTO
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