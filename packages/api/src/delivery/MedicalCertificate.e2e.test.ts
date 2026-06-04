import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Medical Certificate API End-to-End Tests - Create', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let member: any; 

    beforeAll(async () => {
        app = buildApp();
        await app.ready();

        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });
        await prisma.$connect();
    });

    afterAll(async () => {
        await prisma.$disconnect();
        await app.close();
    });

    beforeEach(async () => {
        const randomSuffix = Math.floor(Math.random() * 10000).toString();
        member = await prisma.member.create({
            data: {
                dni: `E2ECERT${randomSuffix}`,
                name: `Socio E2E Certificado ${randomSuffix}`,
                email: `e2ecert_${randomSuffix}@test.com`,
                birthdate: new Date('2000-01-01'),
                category: 'Pleno',
                status: 'Activo'
            }
        });
    });

    afterEach(async () => {
        if (member) {
            await prisma.medicalCertificate.deleteMany({ where: { member_id: member.id } });
            await prisma.member.deleteMany({ where: { id: member.id } });
        }
    });

    it('1. POST: Debe crear un certificado médico en la base de datos real para el socio', async () => {
        const today = new Date();
        const doctorLicense = `MN-${Math.floor(Math.random() * 100000)}`;
        const payload = {
            member_id: member.id,
            issue_date: today.toISOString(),
            expiry_date: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            doctor_license: doctorLicense
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/medical-certificates',
            payload
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);

        expect(body.data.id).toBeDefined();

        const dbCertificate = await prisma.medicalCertificate.findUnique({
            where: { id: body.data.id }
        });

        expect(dbCertificate).not.toBeNull();
        expect(dbCertificate?.doctor_license).toBe(doctorLicense);
        expect(dbCertificate?.member_id).toBe(member.id);
    });

    it('2. POST: Debe fallar con 400 si las fechas del certificado son incoherentes', async () => {
        const doctorLicense = `MN-${Math.floor(Math.random() * 100000)}`;
        const payload = {
            member_id: member.id,
            issue_date: '2026-06-15T00:00:00.000Z',
            expiry_date: '2026-06-10T00:00:00.000Z', 
            doctor_license: doctorLicense
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/medical-certificates',
            payload
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body.message).toContain('La fecha de vencimiento debe ser posterior a la de emisión');
    });
});