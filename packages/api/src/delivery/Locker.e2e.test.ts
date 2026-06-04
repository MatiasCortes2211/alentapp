import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Locker API End-to-End Tests', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    
    // Array para guardar los IDs generados y limpiarlos al final
    const testIdsToClean: string[] = [];

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
        
        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });
        await prisma.$connect();
    });

    afterAll(async () => {
        // Limpia de la base de datos todos los casilleros que se hayan creado
        if (testIdsToClean.length > 0) {
            await prisma.locker.deleteMany({
                where: { id: { in: testIdsToClean } }
            });
        }
        await prisma.$disconnect();
        await app.close();
    });

    describe('POST /api/v1/lockers (Create)', () => {
        it('1. POST: Debe crear un casillero en la base de datos real', async () => {
            // Se genera un numero de casillero muy alto y aleatorio para no chocar con los ya creados en la BD
            const uniqueNumber = Math.floor(Math.random() * 10000) + 1000;
            
            const payload = {
                number: uniqueNumber,
                location: 'Female'
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/lockers',
                payload
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            testIdsToClean.push(body.data.id);              // Registra el ID en el array para limpiarlo al final
            
            // Se busca el registro directamente en PostgreSQL
            const dbLocker = await prisma.locker.findUnique({ where: { id: body.data.id } });            
            expect(dbLocker).not.toBeNull();
            expect(dbLocker?.number).toBe(uniqueNumber);
            expect(dbLocker?.status).toBe('Available');
        });

        it('2. POST: Debe fallar al crear si el número ya está en la DB real', async () => {
            // Se genera un numero de casillero muy alto y aleatorio para no chocar con los ya creados en la BD
            const uniqueNumber = Math.floor(Math.random() * 10000) + 1000;
            
            // Inserta un casillero por prisma
            const existing = await prisma.locker.create({
                data: { number: uniqueNumber, location: 'Male', status: 'Available', is_deleted: false }
            });
            testIdsToClean.push(existing.id);              // Registra el ID en el array para limpiarlo al final    

            // Intenta crear un casillero con el mismo numero
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/lockers',
                payload: { number: uniqueNumber, location: 'Male' }
            });

            expect(response.statusCode).toBe(409);
        });
    });

    describe('PATCH /api/v1/lockers/:id (Update)', () => {
        it('3. PATCH: Debe actualizar el casillero modificando la base de datos real', async () => {
            // Se genera un numero de casillero muy alto y aleatorio para no chocar con los ya creados en la BD
            const uniqueNumber = Math.floor(Math.random() * 10000) + 1000;
            
            // Inserta un casillero por prisma
            const existing = await prisma.locker.create({
                data: { number: uniqueNumber, location: 'Kids', status: 'Available', is_deleted: false }
            });
            testIdsToClean.push(existing.id);              // Registra el ID en el array para limpiarlo al final    

            // Edita el casillero por API
            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/lockers/${existing.id}`,
                payload: { status: 'Maintenance' }
            });

            expect(response.statusCode).toBe(200);

            // Verifica en PostgreSQL que el estado cambió
            const dbLocker = await prisma.locker.findUnique({ where: { id: existing.id } });
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
            // Se genera un numero de casillero muy alto y aleatorio para no chocar con los ya creados en la BD
            const uniqueNumber = Math.floor(Math.random() * 10000) + 1000;
            
            // Inserta un casillero por prisma
            const existing = await prisma.locker.create({
                data: { number: uniqueNumber, location: 'Male', status: 'Occupied', is_deleted: false }
            });
            testIdsToClean.push(existing.id);              // Registra el ID en el array para limpiarlo al final
            
            // Elimina el casillero por API
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/lockers/${existing.id}`
            });

            expect(response.statusCode).toBe(204);

            // Verifica en PostgreSQL que se aplicó
            const dbLocker = await prisma.locker.findUnique({ where: { id: existing.id } });
            expect(dbLocker?.is_deleted).toBe(true);
            expect(dbLocker?.status).toBe('Available');
            expect(dbLocker?.member_id).toBeNull();
        });

        it('6. DELETE: Debe fallar si se intenta eliminar un casillero ya eliminado', async () => {
            // Se genera un numero de casillero muy alto y aleatorio para no chocar con los ya creados en la BD
            const uniqueNumber = Math.floor(Math.random() * 10000) + 1000;
            
            // Inserta un casillero por prisma
            const existing = await prisma.locker.create({
                data: { number: uniqueNumber, location: 'Male', status: 'Available', is_deleted: true } // La eliminación lógica ya está en true
            });
            testIdsToClean.push(existing.id);              // Registra el ID en el array para limpiarlo al final
            
            // Intenta eliminar el casillero ya eliminado
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/lockers/${existing.id}`      // El mismo casillero que acabamos de borrar
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