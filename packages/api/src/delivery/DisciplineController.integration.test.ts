import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

vi.mock('../infrastructure/PostgresDisciplineRepository.js', () => {
    return {
        PostgresDisciplineRepository: class {
            async delete(id: string) { 
                if (id === 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44') {
                    throw new Error('Error inesperado de base de datos');
                }
                return; 
            }
            async findById(id: string) { 
                if (id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') return { id, is_deleted: false };
                if (id === 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22') return { id, is_deleted: true };
                if (id === 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44') return { id, is_deleted: false };
                return null; 
            }

            
        }
    };
});

describe('Discipline API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });


    describe('DELETE /api/v1/disciplinas/:id', () => {
        it('debe retornar 204 si se elimina correctamente', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/disciplines/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
            });

            expect(response.statusCode).toBe(204);
            expect(response.payload).toBe('');
        });

        it('debe retornar 400 si ID de la disciplina a eliminar es inválido', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/disciplines/999' 
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('ID de disciplina inválido');
        });

        it('debe retornar 404 si la disciplina a eliminar no existe', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/disciplines/b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a23' 
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('La disciplina no existe');
        });

        it('debe retornar 409 si la disciplina a eliminar ya está eliminada', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/disciplines/b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' 
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('La disciplina ya fue eliminada');
        });

        it('debe retornar 500 si hubo un error de servidor', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/disciplines/d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44' 
            });

            expect(response.statusCode).toBe(500);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Error al eliminar la disciplina');
        });
    });
});
