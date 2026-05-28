import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Locker API End-to-End Tests - Create', () => {
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
        createdLockerId = body.data.id;                    // Guarda el ID para borrarlo despues
        
        // Se busca el registro directamente en Postgre
        const dbLocker = await prisma.locker.findUnique({ where: { id: createdLockerId } });
        expect(dbLocker).not.toBeNull();
        expect(dbLocker?.number).toBe(testLockerNumber);
        expect(dbLocker?.status).toBe('Available');
    });

    it('2. POST: Debe fallar al crear si el número ya está en la DB real', async () => {
        const payload = {
            number: testLockerNumber,                      // Intenta crear otro casillero con el mismo numero
            location: 'Male'
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/lockers',
            payload
        });

        expect(response.statusCode).toBe(409);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('Ya existe un casillero activo con ese número');
    });
});