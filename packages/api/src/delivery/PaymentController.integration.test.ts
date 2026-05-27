import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreatePaymentRequest } from '@alentapp/shared';

// Mockeamos ambos repositorios para no necesitar base de datos real
// Testeamos el ciclo completo: Fastify -> Controller -> UseCase -> Validator
vi.mock('../infrastructure/PostgresPaymentRepository.js', () => {
    return {
        PostgresPaymentRepository: class {
            async create(data: any) {
                return {
                    id: '123e4567-e89b-12d3-a456-426614174001',
                    ...data,
                    status: 'PENDING',
                    payment_date: null,
                    is_deleted: false,
                };
            }
            async findActiveByMemberMonthYear(memberId: string, month: number, year: number) {
                // Simulamos pago duplicado solo para este caso
                if (memberId === '123e4567-e89b-12d3-a456-426614174000' && month === 1 && year === 2025) {
                    return { id: 'existing-payment' };
                }
                return null;
            }
            async findAll() { return []; }
            async findById() { return null; }
            async delete() { return; }
            async update() { return; }
            async softDeleteByMemberId() { return; }
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
            async findAll() { return []; }
            async findByDni() { return null; }
            async create(data: any) { return { id: '1', ...data }; }
            async update(id: string, data: any) { return { id, ...data }; }
            async delete() { return; }
        }
    };
});

vi.mock('../infrastructure/PostgresMedicalCertificateRepository.js', () => ({ PostgresMedicalCertificateRepository: class {} }));
vi.mock('../infrastructure/PostgresSportRepository.js', () => ({ PostgresSportRepository: class {} }));
vi.mock('../infrastructure/PostgresLockerRepository.js', () => ({ PostgresLockerRepository: class {} }));
vi.mock('../infrastructure/PostgresDisciplineRepository.js', () => ({ PostgresDisciplineRepository: class {} }));
   
describe('Payment API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/payments', () => {

        it('debe retornar 201 y crear el pago con status PENDING y payment_date null', async () => {
            const payload: CreatePaymentRequest = {
                amount: 5000,
                month: 6,
                year: 2026,
                due_date: '2026-06-30',
                member_id: '123e4567-e89b-12d3-a456-426614174000',
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.status).toBe('PENDING');
            expect(body.data.payment_date).toBeNull();
            expect(body.data.id).toBeDefined();
        });

        it('debe retornar 400 si faltan campos obligatorios (ej amount ausente)', async () => {
            const payload = {
                month: 6,
                year: 2026,
                due_date: '2026-06-30',
                member_id: '123e4567-e89b-12d3-a456-426614174000',
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload
            });

            expect(response.statusCode).toBe(400);

            const body = JSON.parse(response.payload);
            expect(body.error).toBe("El monto es obligatorio y debe ser un número");
        });

        it('debe retornar 404 si el miembro no existe', async () => {
            const payload: CreatePaymentRequest = {
                amount: 5000,
                month: 6,
                year: 2026,
                due_date: '2026-06-30',
                member_id: '123e4567-e89b-12d3-a456-000000000000', // UUID que no existe en el mock
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El miembro ingresado no existe en el sistema');
        });

        it('debe retornar 409 si ya existe un pago activo para ese miembro, mes y año', async () => {
            const payload: CreatePaymentRequest = {
                amount: 5000,
                month: 1,   // mes y año que mockeamos como duplicado
                year: 2025,
                due_date: '2026-06-30',
                member_id: '123e4567-e89b-12d3-a456-426614174000',
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Ya existe un pago activo para este socio en el mismo mes y año');
        });

    });
});