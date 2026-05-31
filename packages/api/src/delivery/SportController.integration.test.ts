import 'dotenv/config'
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

vi.mock('../infrastructure/PostgresSportRepository.js', () => {
    return {
        PostgresSportRepository: class {
            async findByName(name: string) {
                if (name === 'Fútbol') return { id: 'uuid-existente', name: 'Fútbol', is_deleted: false };
                return null;
            }
            async create(data: any) {
                if (data.name === 'Error') {
                    throw new Error('Database connection failed');
                }
                return { id: 'nuevo-uuid-123', ...data, is_deleted: false };
            }
            async findById(id: string) {
                if (id === 'f47ac10b-58cc-4372-a567-0e02b2c3d479') return { id, is_deleted: false };
                if (id === '8a3e74a8-92d5-455a-bd54-5264b3c43555') return { id, is_deleted: true };
                if (id === '8a3e74a8-92d5-455a-bd54-5264b3c43500') return { id, is_deleted: false };
                if (id === '8a3e74a8-92d5-455a-bd54-5264b3c43999') return { id, is_deleted: false };
                return null;
            }
            async delete(id: string) { 
                if (id === '8a3e74a8-92d5-455a-bd54-5264b3c43500') {
                    throw new Error('Database connection failed');
                }
                return;
            }
            async countActiveEnrollments(id: string) {
                if (id === '8a3e74a8-92d5-455a-bd54-5264b3c43999') return 10;
                return 0;
            }
            async update(id: string, data: any) {
                if (id === '8a3e74a8-92d5-455a-bd54-5264b3c43500') {
                    throw new Error('Database connection failed');
                }
                return { id, description: 'Deporte original', max_capacity: 15, ...data, is_deleted: false };
            }
        }
    };
});

describe('Sport API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/sports', () => {
        it('debe crear un nuevo deporte y devolver status 201', async () => {
            const payload = {
                name: 'Natación',
                    description: 'Deporte con agua',
                    max_capacity: 30,
                    additional_price: 7500,
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
            expect(body.data.name).toBe('Natación');
            expect(body.data.is_deleted).toBe(false);
        });

        it('debe devolver status 400 si hay un error de validación (faltan campos)', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload: {
                    max_capacity: 20
                }
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBeDefined();
        });

        it('debe devolver status 409 si el nombre del deporte ya existe', async () => {
            const payload = {
                name: 'Fútbol',
                description: 'Deporte de equipo',
                max_capacity: 22,
                additional_price: 0,
                requires_medical_certificate: true
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Ya existe un deporte con ese nombre.');
        });

        it('debe devolver status 500 si ocurre un error en el servidor', async () => {
            const payload = {
                name: 'Error', // Este nombre está mockeado para forzar una excepción
                description: 'Deporte que rompe la BD',
                max_capacity: 10,
                additional_price: 0,
                requires_medical_certificate: false
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload
            });

            expect(response.statusCode).toBe(500);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Ocurrió un error inesperado. Por favor, intentá de nuevo más tarde.');
        });
    });
        
    describe('PATCH /api/v1/sports/:id', () => {
        it('debe devolver 200 y actualizar parcialmente el deporte (solo descripción)', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/sports/f47ac10b-58cc-4372-a567-0e02b2c3d479',
                payload: {
                    description: 'Descripción actualizada'
                }
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.description).toBe('Descripción actualizada');
            expect(body.data.max_capacity).toBe(15);
        });

        it('debe devolver 400 si la capacidad máxima es inválida', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/sports/f47ac10b-58cc-4372-a567-0e02b2c3d479',
                payload: { max_capacity: -5 }
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('La capacidad máxima debe ser mayor a 0.');
        });

        it('debe devolver 404 si el deporte no existe', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/sports/8a3e74a8-92d5-455a-bd54-000000000000',
                payload: { max_capacity: 20 }
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El deporte no existe.');
        });

        it('debe devolver 409 si el deporte ya está eliminado', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/sports/8a3e74a8-92d5-455a-bd54-5264b3c43555',
                payload: { max_capacity: 20 }
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El deporte ya está eliminado.');
        });

        it('debe devolver 409 si la capacidad nueva es menor a los inscriptos activos', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/sports/8a3e74a8-92d5-455a-bd54-5264b3c43999',
                payload: { max_capacity: 5 }
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('La capacidad máxima no puede ser menor a la cantidad de inscriptos activos.');
        });

        it('debe devolver status 500 si ocurre un error en el servidor', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/sports/8a3e74a8-92d5-455a-bd54-5264b3c43500',
                payload: { max_capacity: 20 }
            });

            expect(response.statusCode).toBe(500);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Ocurrió un error inesperado. Por favor, intentá de nuevo más tarde.');
        });
    });

    describe('DELETE /api/v1/sports/:id', () => {
        it('debe devolver status 204 si la eliminación es exitosa', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/sports/f47ac10b-58cc-4372-a567-0e02b2c3d479'
            });

            expect(response.statusCode).toBe(204);
            expect(response.payload).toBe('');
        });

        //No hago test para 'debe devolver status 400 si el ID es obligatorio (falta el parámetro)' porque Fastify toma los parámetros de la URL y no permite que falten, por lo que no se puede simular esa situación.

        it('debe devolver status 400 si el ID es inválido', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/sports/id-invalido'
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('ID inválido.');
        });

        it('debe devolver status 404 si el deporte no existe', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/sports/8a3e74a8-92d5-455a-bd54-5264b3c43550' //Cambio un número para que no lo encuentre
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El deporte no existe.');
        });

        it('debe devolver status 409 si el deporte ya está eliminado', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/sports/8a3e74a8-92d5-455a-bd54-5264b3c43555'
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El deporte ya está eliminado.');
        });

        it('debe devolver status 500 si ocurre un error en el servidor', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/sports/8a3e74a8-92d5-455a-bd54-5264b3c43500'
            });

            expect(response.statusCode).toBe(500);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Ocurrió un error inesperado. Por favor, intentá de nuevo más tarde.');
        });
    });
});