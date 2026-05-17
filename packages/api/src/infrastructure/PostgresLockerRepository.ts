import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerDTO, UpdateLockerRequest } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBLocker = {
    id: string;
    number: number;
    location: 'Male' | 'Female' | 'Kids';
    status: 'Available' | 'Occupied' | 'Maintenance';
    end_contract_date: Date | null;
    member_id: string | null;
    is_deleted: boolean;
};

export class PostgresLockerRepository implements LockerRepository {
    async create(data: Omit<LockerDTO, 'id' | 'is_deleted'>): Promise<LockerDTO> {
        const locker = await prisma.locker.create({
            data: {
                number: data.number,
                location: data.location,
                status: data.status,
                end_contract_date: data.end_contract_date ? new Date(data.end_contract_date) : null,
                member_id: data.member_id,
            },
        });

        return this.mapToDTO(locker);
    }

    async findById(id: string): Promise<LockerDTO | null> {
        const locker = await prisma.locker.findUnique({
            where: { id },
        });

        return locker ? this.mapToDTO(locker) : null;
    }

    async findByNumber(number: number): Promise<LockerDTO | null> {
        const locker = await prisma.locker.findFirst({
            where: { number },
        });

        return locker ? this.mapToDTO(locker) : null;
    }

    async findAll(): Promise<LockerDTO[]> {
        const lockers = await prisma.locker.findMany({
            where: { is_deleted: false },
            orderBy: { number: 'asc' },
        });

        return lockers.map(this.mapToDTO);
    }

    async update(id: string, data: UpdateLockerRequest): Promise<LockerDTO> {
        const locker = await prisma.locker.update({
            where: { id },
            data: {
                ...(data.number && { number: data.number }),
                ...(data.location && { location: data.location }),
                ...(data.status && { status: data.status }),
                ...(data.end_contract_date !== undefined && {
                    end_contract_date: data.end_contract_date ? new Date(data.end_contract_date) : null,
                }),
                ...(data.member_id !== undefined && { member_id: data.member_id }),
                ...(data.is_deleted !== undefined && { is_deleted: data.is_deleted }),
            },
        });

        return this.mapToDTO(locker);
    }

    async delete(id: string): Promise<void> {
        await prisma.locker.update({
            where: { id },
            data: {
                is_deleted: true,
                member_id: null,
                end_contract_date: null,
                status: 'Available',
            },
        });
    }

    private mapToDTO(locker: DBLocker): LockerDTO {
        return {
            id: locker.id,
            number: locker.number,
            location: locker.location,
            status: locker.status,
            end_contract_date: locker.end_contract_date ? locker.end_contract_date.toISOString() : null,
            member_id: locker.member_id,
            is_deleted: locker.is_deleted,
        };
    }
}