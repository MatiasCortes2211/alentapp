import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { SportRepository } from '../domain/SportRepository.js';
import { Sport } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBSport = {
    id: string;
    name: string;
    description: string;
    max_capacity: number;
    additional_price: number;
    requires_medical_certificate: boolean;
    is_deleted: boolean;
};

export class PostgresSportRepository implements SportRepository {
    async create(data: Omit<Sport, 'id'>): Promise<Sport> {
        const sport = await prisma.sport.create({
            data: {
                name: data.name,
                description: data.description,
                max_capacity: data.max_capacity,
                additional_price: data.additional_price,
                requires_medical_certificate: data.requires_medical_certificate,
                is_deleted: data.is_deleted,
            },
        });

        return this.mapToDTO(sport);
    }

    async findByName(name: string):
    Promise<Sport | null> {
        const sport = await prisma.sport.findFirst({
            where: {
                name,
            },
        });

        return sport ? this.mapToDTO(sport) : null;
    }

    private mapToDTO(sport: DBSport): Sport {
        return {
            id: sport.id,
            name: sport.name,
            description: sport.description,
            max_capacity: sport.max_capacity,
            additional_price: sport.additional_price,
            requires_medical_certificate: sport.requires_medical_certificate,
            is_deleted: sport.is_deleted,
        };
    }
}