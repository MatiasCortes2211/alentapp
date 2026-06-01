import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Locker API End-to-End Tests', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let createdLockerId: string;
    
    // Se genera un numero de casillero muy alto y aleatorio para no chocar con los ya creados en la BD
    const testLockerNumber = Math.floor(Math.random() * 10000) + 1000;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
        
        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });
        await prisma.$connect();
    });

    afterAll(async () => {
        // Se borra físicamente el casillero de prueba
        if (createdLockerId) {
            await prisma.locker.deleteMany({
                where: { id: createdLockerId }
            });
        }
        await prisma.$disconnect();
        await app.close();
    });

    describe('POST /api/v1/lockers (Create)', () => {
        it('1. POST: Debe crear un casillero en la base de datos real', async () => {
            const payload = {
                number: testLockerNumber,
                location: 'Female'
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/lockers',
                payload
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            
            expect(body.data.id).toBeDefined();
            createdLockerId = body.data.id; // Guarda el ID
            
            // Se busca el registro directamente en PostgreSQL
            const dbLocker = await prisma.locker.findUnique({ where: { id: createdLockerId } });
            expect(dbLocker).not.toBeNull();
            expect(dbLocker?.number).toBe(testLockerNumber);
            expect(dbLocker?.status).toBe('Available');
        });

        it('2. POST: Debe fallar al crear si el número ya está en la DB real', async () => {
            const payload = {
                number: testLockerNumber,
                location: 'Male'
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/lockers',
                payload
            });

            expect(response.statusCode).toBe(409);
        });
    });

    describe('PATCH /api/v1/lockers/:id (Update)', () => {
        it('3. PATCH: Debe actualizar el casillero modificando la base de datos real', async () => {
            const updatePayload = {
                status: 'Maintenance'
            };

            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/lockers/${createdLockerId}`,
                payload: updatePayload
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.status).toBe('Maintenance');

            // Verifica en PostgreSQL que el estado cambió
            const dbLocker = await prisma.locker.findUnique({ where: { id: createdLockerId } });
            expect(dbLocker?.status).toBe('Maintenance');
        });

        it('4. PATCH: Debe fallar si el casillero no existe en la DB', async () => {
            const fakeId = '123e4567-e89b-12d3-a456-426614174000'; // UUID falso
            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/lockers/${fakeId}`,
                payload: { status: 'Maintenance' }
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El casillero no existe');
        });
    });

    describe('DELETE /api/v1/lockers/:id (Delete)', () => {
        it('5. DELETE: Debe eliminar el casillero lógicamente en la base de datos real', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/lockers/${createdLockerId}` // El casillero real que venimos usando
            });

            expect(response.statusCode).toBe(204);

            // Verifica en PostgreSQL que se aplicó
            const dbLocker = await prisma.locker.findUnique({ where: { id: createdLockerId } });
            expect(dbLocker?.is_deleted).toBe(true);
            expect(dbLocker?.status).toBe('Available');
            expect(dbLocker?.member_id).toBeNull();
        });

        it('6. DELETE: Debe fallar si se intenta eliminar un casillero ya eliminado', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/lockers/${createdLockerId}` // El mismo casillero que acabamos de borrar
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El casillero ya fue eliminado previamente');
        });

        it('7. DELETE: Debe fallar si el casillero no existe en la DB real', async () => {
            const fakeId = '123e4567-e89b-12d3-a456-426614174000'; // UUID falso
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/lockers/${fakeId}`
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El casillero no existe');
        });
    });
});