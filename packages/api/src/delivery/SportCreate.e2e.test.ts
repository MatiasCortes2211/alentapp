import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Sport API End-to-End Tests Create', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    
    const baseSportName = 'Natación';

    beforeAll(async () => {
        app = buildApp();
        await app.ready();

        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });
        await prisma.$connect();
    });

    afterAll(async () => {
        await prisma.sport.deleteMany({
            where: {
                name: {
                    contains: baseSportName
                }
            }
        });
        
        await prisma.$disconnect();
        await app.close();
    });

    it('1. POST: Debe crear un deporte en la base de datos y devolver 201', async () => {
        const randomSuffix = Math.floor(Math.random() * 100000).toString();
        const testSportName = `${baseSportName} ${randomSuffix}`;

        const payload = {
            name: testSportName,
            description: 'Deporte de prueba para testear la creación',
            max_capacity: 15,
            additional_price: 2000,
            requires_medical_certificate: true
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/sports',
            payload
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);
        
        expect(body.data.id).toBeDefined();
        expect(body.data.name).toBe(testSportName);
        expect(body.data.is_deleted).toBe(false);

        const dbSport = await prisma.sport.findUnique({
            where: { id: body.data.id }
        });
        
        expect(dbSport).not.toBeNull();
        expect(dbSport?.name).toBe(testSportName);
        expect(dbSport?.description).toBe('Deporte de prueba para testear la creación');
        expect(dbSport?.max_capacity).toBe(15);
        expect(dbSport?.additional_price).toBe(2000);
        expect(dbSport?.requires_medical_certificate).toBe(true);
        expect(dbSport?.is_deleted).toBe(false);
    });

    it('2. POST: Debe fallar con 400 si faltan campos obligatorios (Zod)', async () => {
        const invalidPayload = {
            description: 'Falta el nombre y la capacidad máxima'
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/sports',
            payload: invalidPayload
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body.error).toBeDefined(); 
    });

    it('3. POST: Debe fallar con 409 si se intenta crear un deporte con un nombre que ya existe', async () => {
        const randomSuffix = Math.floor(Math.random() * 100000).toString();
        const duplicateSportName = `${baseSportName} ${randomSuffix}`;
        
        await prisma.sport.create({
            data: {
                name: duplicateSportName,
                description: 'Deporte insertado manualmente para forzar error 409',
                max_capacity: 10,
                additional_price: 0,
                requires_medical_certificate: false
            }
        });

        const duplicatePayload = {
            name: duplicateSportName,
            description: 'Nombre duplicado para testear conflicto',
            max_capacity: 20,
            additional_price: 5000,
            requires_medical_certificate: false
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/sports',
            payload: duplicatePayload
        });

        expect(response.statusCode).toBe(409);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('Ya existe un deporte con ese nombre.');
    });
});