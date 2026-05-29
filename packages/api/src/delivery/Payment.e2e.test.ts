import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Payment API End-to-End Tests', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let createdMemberId: string;
    let createdPaymentId: string;

    const randomSuffix = Math.floor(Math.random() * 100000).toString();
    const testDni = `PAY${randomSuffix}`;
    const testEmail = `pay${randomSuffix}@test.com`;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();

        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });
        await prisma.$connect();

        // Creamos un miembro real para asociar los pagos
        const member = await prisma.member.create({
            data: {
                name: 'Socio E2E Payment',
                dni: testDni,
                email: testEmail,
                birthdate: new Date('1990-01-01'),
                category: 'Pleno',
                status: 'Activo',
            }
        });
        createdMemberId = member.id;
    });

    afterAll(async () => {
        // Limpiamos pagos y miembro creados
        if (createdPaymentId) {
            await prisma.payment.deleteMany({ where: { member_id: createdMemberId } });
        }
        if (createdMemberId) {
            await prisma.member.deleteMany({ where: { id: createdMemberId } });
        }
        await prisma.$disconnect();
        await app.close();
    });

    it('1. POST: Debe crear un pago en la base de datos real', async () => {
        const payload = {
            amount: 5000,
            month: 6,
            year: 2026,
            due_date: '2026-06-30',
            member_id: createdMemberId,
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/payments',
            payload
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);

        expect(body.data.id).toBeDefined();
        expect(body.data.status).toBe('PENDING');
        expect(body.data.payment_date).toBeNull();

        // Guardamos el ID para usarlo en los siguientes tests y poder limpiar la DB luego
        createdPaymentId = body.data.id;

        // Verificación directa en PostgreSQL
        const dbPayment = await prisma.payment.findUnique({ where: { id: createdPaymentId } });
        expect(dbPayment).not.toBeNull();
        expect(dbPayment?.status).toBe('PENDING');
    });

    it('2. POST: Debe fallar si el miembro no existe', async () => {
        const payload = {
            amount: 5000,
            month: 7,
            year: 2026,
            due_date: '2026-07-30',
            member_id: '123e4567-e89b-12d3-a456-000000000000',
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/payments',
            payload
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('El miembro ingresado no existe en el sistema');
    });

    it('3. POST: Debe fallar si ya existe un pago activo para ese miembro, mes y año', async () => {
        const payload = {
            amount: 5000,
            month: 6, // mismo mes y año que el test 1
            year: 2026,
            due_date: '2026-06-30',
            member_id: createdMemberId,
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/payments',
            payload
        });

        expect(response.statusCode).toBe(409);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('Ya existe un pago activo para este socio en el mismo mes y año');
    });

    it('4. PATCH: Debe actualizar el pago a PAID en la base de datos real', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: `/api/v1/payments/${createdPaymentId}`,
            payload: { status: 'PAID' }
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.data.status).toBe('PAID');
        expect(body.data.payment_date).not.toBeNull();

        const dbPayment = await prisma.payment.findUnique({ where: { id: createdPaymentId } });
        expect(dbPayment?.status).toBe('PAID');
        expect(dbPayment?.payment_date).not.toBeNull();
    });

    it('5. PATCH: Debe fallar si el pago ya está en estado PAID', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: `/api/v1/payments/${createdPaymentId}`,
            payload: { status: 'CANCELED' }
        });

        expect(response.statusCode).toBe(409);
        const body = JSON.parse(response.payload);
        expect(body.error).toContain('ya se encuentra en estado');
    });

    it('6. PATCH: Debe fallar si el pago no existe', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: `/api/v1/payments/123e4567-e89b-12d3-a456-000000000000`,
            payload: { status: 'PAID' }
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('El pago ingresado no existe en el sistema');
    });

});