import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateLockerRequest } from '@alentapp/shared';

vi.mock('../infrastructure/PostgresLockerRepository.js', () => {
    return {
        PostgresLockerRepository: class {
            async findAll() { return []; }
            async findByNumber(number: number) { 
                // Simulamos que el casillero con num.99 ya existe
                return number === 99 ? { id: 'l-99', number: 99, is_deleted: false } : null; 
            }
            async create(data: any) { 
                return { id: 'nuevo-locker-id', ...data, is_deleted: false }; 
            }
            
            async update(id: string, data: any) { return { id, ...data }; }
            async delete(id: string) { return; }
            async findById(id: string) { return null; }
            async releaseByMemberId(id: string) { return; }
        }
    };
});

vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findById(id: string) { 
                return id === 'socio-valido' ? { id: 'socio-valido', status: 'Activo' } : null; 
            }
            async findByDni() { return null; }
            async findAll() { return []; }
            async create() { return {}; }
            async update() { return {}; }
            async delete() { return; }
        }
    };
});

describe('Locker API Integration Tests - Create', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready(); 
    });

    afterAll(async () => {
        await app.close();
    });

    it('1. POST /api/v1/lockers - debe retornar 201 y crear el casillero', async () => {
        const payload: CreateLockerRequest = {
            number: 10,
            location: 'Kids',
        };

        // Simulamos una petición HTTP a nuestro endpoint
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/lockers',
            payload
        });

        expect(response.statusCode).toBe(201);
        
        const body = JSON.parse(response.payload);
        expect(body.data.number).toBe(10);
        expect(body.data.location).toBe('Kids');
        expect(body.data.id).toBe('nuevo-locker-id');
    });

    it('2. POST /api/v1/lockers - debe atravesar validaciones y retornar 409 si el número ya existe', async () => {
        const payload: CreateLockerRequest = {
            number: 99,
            location: 'Male'
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/lockers',
            payload
        });

        // Verificamos que el Validator atrapo el error y el Controller lo transformó en 409
        expect(response.statusCode).toBe(409);
        
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('Ya existe un casillero activo con ese número');
    });
});