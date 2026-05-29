//Este test verifica que al eliminar una disciplina, el campo is_deleted se actualice a true en la base de datos real, y que no se elimine físicamente el registro.

import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Discipline API End-to-End Tests', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let createdMemberId: string;
    let createdDisciplineId: string;
    
    const randomSuffix = Math.floor(Math.random() * 100000).toString();
    const testDni = `E2E${randomSuffix}`;
    const testEmail = `e2e${randomSuffix}@test.com`;

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
                name: 'Socio para Disciplina E2E',
                email: testEmail,
                birthdate: new Date('2026-01-01'),
                category: 'Pleno'
            }
        });
        createdMemberId = member.id;

        const discipline = await prisma.discipline.create({
            data: {
                reason: 'Conducta Inapropiada E2E',
                start_date: new Date('2026-05-27'),
                end_date: new Date('2026-12-31'),
                is_total_suspension: false,
                member_id: createdMemberId
            }
        });
        createdDisciplineId = discipline.id;



    });

    afterAll(async () => {
        if (createdMemberId) {
            await prisma.discipline.deleteMany({
                where: { member_id: createdMemberId }
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

        it('POST: Debe crear una disciplina con status 201 y mantener el estado del miembro si la disciplina no es vigente', async () => {
            const today = new Date();
            const pastDate1 = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];
            const pastDate2 = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate()).toISOString().split('T')[0];

            const payload = {
            reason: 'Motivo de la disciplina',
            start_date: pastDate2,
            end_date: pastDate1,
            is_total_suspension: true,
            member_id: createdMemberId,
        };
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/disciplines',
            payload
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);
        expect(body.data.is_deleted).toBe(false);
        expect(body.data.member_id).toBe(createdMemberId);

        const dbDiscipline = await prisma.discipline.findUnique({
            where: { id: body.data.id }
        });
        expect(dbDiscipline).not.toBeNull();
        expect(dbDiscipline?.is_deleted).toBe(false);

        const dbMember = await prisma.member.findUnique({
            where: { id: createdMemberId }
        });
        expect(dbMember).not.toBeNull();
        expect(dbMember?.status).toBe('Activo');
    });

    it('POST: Debe crear una disciplina con status 201 y estado de miembro a suspendido si la disciplina es vigente', async () => {
        const today = new Date();
        const futureDate1 = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];
        const futureDate2 = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate()).toISOString().split('T')[0];

        const payload = {
            reason: 'Motivo de la disciplina',
            start_date: futureDate1,
            end_date: futureDate2,
            is_total_suspension: true,
            member_id: createdMemberId,
        };
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/disciplines',
            payload
        });
        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);
        expect(body.data.is_deleted).toBe(false);
        expect(body.data.member_id).toBe(createdMemberId);

        const dbDiscipline = await prisma.discipline.findUnique({
            where: { id: body.data.id }
        });
        expect(dbDiscipline).not.toBeNull();
        expect(dbDiscipline?.is_deleted).toBe(false);

        const dbMember = await prisma.member.findUnique({
            where: { id: createdMemberId }
        });
        expect(dbMember).not.toBeNull();
        expect(dbMember?.status).toBe('Suspendido');
    });

    it('DELETE: Debe eliminar la disciplina cambiando su estado is_deleted a true y devolver código 204', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/v1/disciplines/${createdDisciplineId}`
        });

        expect(response.statusCode).toBe(204);
        const dbDiscipline = await prisma.discipline.findUnique({
            where: { id: createdDisciplineId }
        });
        expect(dbDiscipline).not.toBeNull();
        expect(dbDiscipline?.is_deleted).toBe(true);
    });

});
