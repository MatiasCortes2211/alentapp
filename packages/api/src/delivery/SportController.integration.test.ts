import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

vi.mock('../infrastructure/PostgresMemberRepository.js', () => ({ PostgresMemberRepository: class {} }));
vi.mock('../infrastructure/PostgresMedicalCertificateRepository.js', () => ({ PostgresMedicalCertificateRepository: class {} }));
vi.mock('../infrastructure/PostgresPaymentRepository.js', () => ({ PostgresPaymentRepository: class {} }));
vi.mock('../infrastructure/PostgresDisciplineRepository.js', () => ({ PostgresDisciplineRepository: class {} }));
vi.mock('../infrastructure/PostgresLockerRepository.js', () => ({ PostgresLockerRepository: class {} }));
vi.mock('../infrastructure/PostgresSportRepository.js', () => {
    return {
        PostgresSportRepository: class {
            async findById(id: string) {
                if (id === 'f47ac10b-58cc-4372-a567-0e02b2c3d479') return { id, is_deleted: false };
                if (id === '8a3e74a8-92d5-455a-bd54-5264b3c43555') return { id, is_deleted: true };
                return null;
            }
            async delete(_id: string) { return; }
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
    });
});