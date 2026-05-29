import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Medical Certificate API End-to-End Tests - Create', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let createdMemberId: string;
    let createdCertificateId: string;

    const randomSuffix = Math.floor(Math.random() * 10000).toString();
    const testDni = `E2ECERT${randomSuffix}`;
    const doctorLicense = `MN-${Math.floor(Math.random() * 100000)}`;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();

        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });
        await prisma.$connect();

        const member = await prisma.member.create({
            data: {
                dni: testDni,
                name: `Socio E2E Certificado ${randomSuffix}`,
                email: `e2ecert_${randomSuffix}@test.com`,
                birthdate: new Date('2000-01-01'),
                category: 'Pleno',  
                status: 'Activo'    
            }
        });
        createdMemberId = member.id;
    });

    afterAll(async () => {
        if (createdCertificateId) {
            await prisma.medicalCertificate.deleteMany({
                where: { id: createdCertificateId }
            });
        }
        if (createdMemberId) {
            await prisma.member.deleteMany({
                where: { id: createdMemberId }
            });
        }
        await prisma.$disconnect();
        await app.close();
    });

    it('1. POST: Debe crear un certificado médico en la base de datos real para el socio', async () => {
        const today = new Date();
        const payload = {
            member_id: createdMemberId,
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
        createdCertificateId = body.data.id;

        const dbCertificate = await prisma.medicalCertificate.findUnique({
            where: { id: createdCertificateId }
        });

        expect(dbCertificate).not.toBeNull();
        expect(dbCertificate?.doctor_license).toBe(doctorLicense);
        expect(dbCertificate?.member_id).toBe(createdMemberId);
    });

    it('2. POST: Debe fallar con 400 si las fechas del certificado son incoherentes', async () => {
        const payload = {
            member_id: createdMemberId,
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