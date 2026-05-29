import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateDiscipline } from '@alentapp/shared';

vi.mock('../infrastructure/PostgresDisciplineRepository.js', () => {
    return {
        PostgresDisciplineRepository: class {
            async create(data: any) {
                return { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', ...data, is_deleted: false };
            }
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

vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findById(id: string) {
                if (id === '123e4567-e89b-12d3-a456-426614174000') {
                    return { id, name: 'Juan Perez', status: 'Activo' };
                }
                return null;
            }
            async update(id: string, data: any) {
                return { id, ...data };
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

    describe('POST /api/v1/disciplines', () => {
        it('debe retornar 201 y crear la disciplina si el ID del miembro existe', async () => {
            const payload: CreateDiscipline = {
                reason: 'Motivo de la disciplina',
                start_date: '2026-01-01',
                end_date: '2026-12-31',
                is_total_suspension: true,
                member_id: '123e4567-e89b-12d3-a456-426614174000',
            };
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/disciplines',
                payload
            });
            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.is_deleted).toBe(false);
            expect(body.data.member_id).toBe('123e4567-e89b-12d3-a456-426614174000');
        });

        it('debe retornar 400 y no crear la disciplina si falta un campo obligatorio', async () => {
            const payload = {
                reason: 'Motivo de la disciplina',
                end_date: '2026-01-01',
                is_total_suspension: true,
                member_id: '123e4567-e89b-12d3-a456-426614174000'
            };
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/disciplines',
                payload
            });
            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('La fecha de inicio es obligatoria');
        });

        it('debe retornar 400 y no crear la disciplina si la fecha de inicio es posterior a la fecha de fin', async () => {
            const payload: CreateDiscipline = {
                reason: 'Motivo de la disciplina',
                start_date: '2026-12-31',
                end_date: '2026-01-01',
                is_total_suspension: true,
                member_id: '123e4567-e89b-12d3-a456-426614174000'
            };
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/disciplines',
                payload
            });
            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('La fecha de fin debe ser posterior a la fecha de inicio');
        });

        it('debe retornar 404 y no crear la disciplina si el ID del miembro no existe', async () => {
            const payload: CreateDiscipline = {
                reason: 'Motivo de la disciplina',
                start_date: '2026-01-01',
                end_date: '2026-12-31',
                is_total_suspension: true,
                member_id: '123e4567-e89b-12d3-a456-026614174000'
            };
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/disciplines',
                payload
            });
            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El miembro ingresado no existe en el sistema');
        });
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
