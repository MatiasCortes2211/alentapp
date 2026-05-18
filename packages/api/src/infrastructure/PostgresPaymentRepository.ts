import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentDTO, PaymentStatus } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});


type DBPayment = {
    id: string;
    amount: any; 
    month: number;
    year: number;
    status: PaymentStatus;
    due_date: Date;
    payment_date: Date | null;
    is_deleted: boolean;
    member_id: string;
};

export class PostgresPaymentRepository implements PaymentRepository {
    async create(data: Omit<PaymentDTO, 'id'>): Promise<PaymentDTO> {
        const payment = await prisma.payment.create({
            data: {
                amount: data.amount,
                month: data.month,
                year: data.year,
                status: data.status,
                due_date: new Date(data.due_date),
                member_id: data.member_id,
            },
        });

        return this.mapToDTO(payment as unknown as DBPayment);
    }

    async findById(id: string): Promise<PaymentDTO | null> {
        const payment = await prisma.payment.findUnique({
            where: { id },
        });

        return payment ? this.mapToDTO(payment as unknown as DBPayment) : null;
    }

    async findAll(): Promise<PaymentDTO[]> {
        const payments = await prisma.payment.findMany({
            where: {
                is_deleted: false, 
            },
            orderBy: [
                { year: 'desc' },   
                { month: 'desc' }, 
            ],
        });
        
        return payments.map(payment => this.mapToDTO(payment as unknown as DBPayment));
    }

    // El método de nuestra regla de negocio para evitar duplicados
    async findActiveByMemberMonthYear(memberId: string, month: number, year: number): Promise<PaymentDTO | null> {
        const payment = await prisma.payment.findFirst({
            where: {
                member_id: memberId,
                month: month,
                year: year,
                is_deleted: false,
                status: {
                    in: [PaymentStatus.Pending, PaymentStatus.Paid],
                },
            },
        });

        return payment ? this.mapToDTO(payment as unknown as DBPayment) : null;
    }

    async delete(id: string): Promise<void> {
        await prisma.payment.update({
            where: { id },
            data: {
                is_deleted: true,
            },
        });
    }

    async update(id: string, status: PaymentStatus.Paid | PaymentStatus.Canceled): Promise<PaymentDTO> {
    const payment = await prisma.payment.update({
        where: { id },
        data: {
            status: status,
            payment_date: status === PaymentStatus.Paid ? new Date() : null,
        },
    });
    
    return this.mapToDTO(payment as unknown as DBPayment);
    }

    private mapToDTO(payment: DBPayment): PaymentDTO {
        return {
            id: payment.id,
            amount: Number(payment.amount), 
            month: payment.month,
            year: payment.year,
            status: payment.status,
            // Extrae solo YYYY-MM-DD para la fecha de vencimiento
            due_date: payment.due_date.toISOString().split('T')[0], 
            payment_date: payment.payment_date ? payment.payment_date.toISOString() : null,
            is_deleted: payment.is_deleted,
            member_id: payment.member_id,
        };
    }
}