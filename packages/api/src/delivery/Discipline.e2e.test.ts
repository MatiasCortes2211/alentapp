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
            await prisma.member.deleteMany({
                where: { id: createdMemberId }
            });
        }
        if (createdDisciplineId) {
            await prisma.discipline.deleteMany({
                where: { id: createdDisciplineId }
            });
        }
        await prisma.$disconnect();
        await app.close();
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
