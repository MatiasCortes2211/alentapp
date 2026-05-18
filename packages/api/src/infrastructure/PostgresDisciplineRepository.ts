import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { Discipline, CreateDiscipline } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBDiscipline = {
    id: string;
    reason: string;
    start_date: Date;
    end_date: Date;
    is_total_suspension: boolean;
    member_id: string;
    is_deleted: boolean;
};

export class PostgresDisciplineRepository implements DisciplineRepository {
    async create(data: Omit<Discipline, 'id'>): Promise<Discipline> {
        const discipline = await prisma.discipline.create({
            data: {
                reason: data.reason,
                start_date: new Date(data.start_date),
                end_date: new Date(data.end_date),
                is_total_suspension: data.is_total_suspension,
                member_id: data.member_id,
                is_deleted: data.is_deleted,
            },
        });

        return this.mapToDTO(discipline);
    }

    async findAll(): Promise<Discipline[]> {
        const disciplines = await prisma.discipline.findMany({
            orderBy: { start_date: 'desc' },
            where: { is_deleted: false },
        });

        return disciplines.map(this.mapToDTO);
    }

    private mapToDTO(discipline: DBDiscipline): Discipline {
        return {
            id: discipline.id,
            reason: discipline.reason,
            start_date: discipline.start_date.toISOString().split('T')[0],
            end_date: discipline.end_date.toISOString().split('T')[0],
            is_total_suspension: discipline.is_total_suspension,
            member_id: discipline.member_id,
            is_deleted: discipline.is_deleted,
        };
    }
}


