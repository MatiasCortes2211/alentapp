import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Sport API End-to-End Tests - Delete', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let createdSportId: string;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
        
        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });
        await prisma.$connect();

        const sport = await prisma.sport.create({
            data: {
                name: 'Natación Delete',
                description: 'Deporte de prueba para testear el borrado lógico',
                max_capacity: 15,
                additional_price: 2000,
                requires_medical_certificate: true,
                is_deleted: false,
            }
        });
        createdSportId = sport.id;
    });

    afterAll(async () => {
        // Limpiamos el deporte creado
        if (createdSportId) {
            await prisma.sport.deleteMany({
                where: { id: createdSportId }
            });
        }
        await prisma.$disconnect();
        await app.close();
    });

    it('1. DELETE: Debe eliminar el deporte cambiando su estado is_deleted a true y devolver código 204', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/v1/sports/${createdSportId}`
        });

        expect(response.statusCode).toBe(204);
        
        // Verificación directa del borrado lógico
        const dbSport = await prisma.sport.findUnique({
            where: { id: createdSportId }
        });
        expect(dbSport).not.toBeNull();
        expect(dbSport?.is_deleted).toBe(true);
    });

    it('2. DELETE: Debe fallar con 409 si se intenta eliminar un deporte que ya está eliminado', async () => {
        // Como el test anterior ya lo eliminó lógicamente, acá debería rebotar
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/v1/sports/${createdSportId}`
        });

        expect(response.statusCode).toBe(409);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('El deporte ya está eliminado.'); 
    });

    it('3. DELETE: Debe fallar con 404 si el ID del deporte no existe', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: '/api/v1/sports/123e4567-e89b-12d3-a456-000000000000'
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('El deporte no existe.');
    });
});