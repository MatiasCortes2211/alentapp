import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateLockerRequest, UpdateLockerRequest,  } from '@alentapp/shared';

// Mock de Casilleros
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
            async findById(id: string) { 
                // Simulamos un casillero valido para el Caso de Uso de Update
                if (id === 'locker-valido') return { id: 'locker-valido', number: 10, status: 'Available', is_deleted: false, member_id: null };
                return null; 
            }
            async update(id: string, data: any) { return { id, ...data }; }
            async delete(id: string) { return; }
            async releaseByMemberId(id: string) { return; }
        }
    };
});

// Mock de Miembros
vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findById(id: string) { 
                if (id === 'socio-valido') return { id: 'socio-valido', status: 'Activo' };
                // Simulamos un socio suspendido
                if (id === '123e4567-e89b-12d3-a456-426614174000') return { id: '123e4567-e89b-12d3-a456-426614174000', status: 'Suspendido' };
                return null; 
            }
            async findByDni() { return null; }
            async findAll() { return []; }
            async create() { return {}; }
            async update() { return {}; }
            async delete() { return; }
        }
    };
});

describe('Locker API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready(); 
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/lockers (Create)', () => {
        it('1. debe retornar 201 y crear el casillero', async () => {
            const payload: CreateLockerRequest = { number: 10, location: 'Kids' };
            const response = await app.inject({ method: 'POST', url: '/api/v1/lockers', payload });
            expect(response.statusCode).toBe(201);
        });

        it('2. debe retornar 409 si el número ya existe', async () => {
            const payload: CreateLockerRequest = { number: 99, location: 'Male' };
            const response = await app.inject({ method: 'POST', url: '/api/v1/lockers', payload });
            expect(response.statusCode).toBe(409);
        });
    });

    describe('PATCH /api/v1/lockers/:id (Update)', () => {
        it('3. debe retornar 200 y actualizar el casillero correctamente', async () => {
            const payload: UpdateLockerRequest = { status: 'Maintenance' };
            const response = await app.inject({ 
                method: 'PATCH', 
                url: '/api/v1/lockers/locker-valido',
                payload 
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.status).toBe('Maintenance');
        });

        it('4. debe retornar 404 si el casillero a editar no existe', async () => {
            const payload: UpdateLockerRequest = { status: 'Maintenance' };
            const response = await app.inject({ 
                method: 'PATCH', 
                url: '/api/v1/lockers/locker-fantasma',   // Casillero que no existe
                payload 
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El casillero no existe');
        });

        it('5. debe retornar 400 si se intenta asignar a un socio suspendido', async () => {
            const payload: UpdateLockerRequest = { 
                member_id: '123e4567-e89b-12d3-a456-426614174000', 
                end_contract_date: '2027-01-01T00:00:00.000Z' 
            };
            const response = await app.inject({ 
                method: 'PATCH', 
                url: '/api/v1/lockers/locker-valido', 
                payload 
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toContain('Un socio suspendido');
        });
    });
});