import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Sport API End-to-End Tests - Update', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let activeSportId: string;
    let deletedSportId: string;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();

        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });
        await prisma.$connect();

        const activeSport = await prisma.sport.create({
            data: {
                name: 'Tenis Update',
                description: 'Deporte para probar actualización',
                max_capacity: 10,
                additional_price: 3000,
                requires_medical_certificate: true,
                is_deleted: false,
            }
        });
        activeSportId = activeSport.id;

        const deletedSport = await prisma.sport.create({
            data: {
                name: 'Tenis Eliminado Update',
                description: 'Deporte eliminado',
                max_capacity: 10,
                additional_price: 3000,
                requires_medical_certificate: true,
                is_deleted: true,
            }
        });
        deletedSportId = deletedSport.id;
    });

    afterAll(async () => {
        await prisma.sport.deleteMany({
            where: { id: { in: [activeSportId, deletedSportId] } }
        });
        
        await prisma.$disconnect();
        await app.close();
    });

    it('1. PATCH: Debe actualizar parcialmente el deporte y devolver 200', async () => {
        const updatePayload = {
            description: 'En cancha de arena',
            max_capacity: 15
        };

        const response = await app.inject({
            method: 'PATCH',
            url: `/api/v1/sports/${activeSportId}`,
            payload: updatePayload
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        
        expect(body.data.description).toBe('En cancha de arena');
        expect(body.data.max_capacity).toBe(15);
        expect(body.data.name).toBe('Tenis Update');

        const dbSport = await prisma.sport.findUnique({ where: { id: activeSportId } });
        expect(dbSport?.description).toBe('En cancha de arena');
        expect(dbSport?.max_capacity).toBe(15);
    });

    it('2. PATCH: Debe fallar con 400 si se intenta modificar un campo inmutable', async () => {
        const invalidPayload = {
            name: 'Tenis de mesa',
            max_capacity: 20
        };

        const response = await app.inject({
            method: 'PATCH',
            url: `/api/v1/sports/${activeSportId}`,
            payload: invalidPayload
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('No se pueden modificar campos inmutables tras la creación del deporte.');
    });

    it('3. PATCH: Debe fallar con 400 si la validación de Zod falla', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: `/api/v1/sports/${activeSportId}`,
            payload: { max_capacity: 0 }
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body.error).toBeDefined();
    });

    it('4. PATCH: Debe fallar con 404 si el ID del deporte no existe', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: '/api/v1/sports/123e4567-e89b-12d3-a456-000000000000',
            payload: { max_capacity: 20 }
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('El deporte no existe.');
    });

    it('5. PATCH: Debe fallar con 409 si el deporte ya está eliminado', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: `/api/v1/sports/${deletedSportId}`,
            payload: { max_capacity: 20 }
        });

        expect(response.statusCode).toBe(409);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('El deporte ya está eliminado.');
    });
});