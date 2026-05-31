import "dotenv/config";
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
            async findById(id: string) {
                if (id === '123e4567-e89b-12d3-a456-426614174001') {
                    return {
                        id,
                        amount: 5000,
                        month: 6,
                        year: 2026,
                        due_date: '2026-06-30',
                        status: 'PENDING',
                        payment_date: null,
                        is_deleted: false,
                        member_id: '123e4567-e89b-12d3-a456-426614174000',
                    };
                }
                if (id === '123e4567-e89b-12d3-a456-426614174002') {
                    return {
                        id,
                        amount: 5000,
                        month: 6,
                        year: 2026,
                        due_date: '2026-06-30',
                        status: 'PAID', // ya pagado
                        payment_date: new Date().toISOString(),
                        is_deleted: false,
                        member_id: '123e4567-e89b-12d3-a456-426614174000',
                    };
                }
                if (id === '123e4567-e89b-12d3-a456-426614174003') {
                    return {
                        id,
                        amount: 5000,
                        month: 6,
                        year: 2026,
                        due_date: '2026-06-30',
                        status: 'PENDING',
                        payment_date: null,
                        is_deleted: true, // ya eliminado
                        member_id: '123e4567-e89b-12d3-a456-426614174000',
                    };
                }
                return null;
            }
            async delete() { return; }
            async update(id: string, status: string) {
                return {
                    id,
                    amount: 5000,
                    month: 6,
                    year: 2026,
                    due_date: '2026-06-30',
                    status: status,
                    payment_date: status === 'PAID' ? new Date().toISOString() : null,
                    is_deleted: false,
                    member_id: '123e4567-e89b-12d3-a456-426614174000',
                };
            }
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

    describe('PATCH /api/v1/payments/:id', () => {
    const validPaymentId = '123e4567-e89b-12d3-a456-426614174001'; // UUID del pago que mockeamos con estado PENDING

        it('debe retornar 200 y el pago actualizado a PAID', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/payments/${validPaymentId}`,
                payload: { status: 'PAID' }
            });

            console.log('BODY:', response.payload); 
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.status).toBe('PAID');
        });

        it('debe retornar 404 si el pago no existe', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/payments/123e4567-e89b-12d3-a456-000000000000`, // UUID que no existe en el mock
                payload: { status: 'PAID' }
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El pago ingresado no existe en el sistema');
        });

        it('debe retornar 409 si el pago ya está en estado PAID o CANCELED', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/payments/123e4567-e89b-12d3-a456-426614174002`, // UUID del pago con estado PAID
                payload: { status: 'CANCELED' }
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toContain('ya se encuentra en estado');
        });
        
    });

    describe('DELETE /api/v1/payments/:id', () => {
        const validPaymentId = '123e4567-e89b-12d3-a456-426614174001'; // UUID del pago que mockeamos como existente y no eliminado
        const deletedPaymentId = '123e4567-e89b-12d3-a456-426614174003'; // UUID del pago que mockeamos como eliminado

        it('debe retornar 204 si el pago se elimina exitosamente', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/payments/${validPaymentId}`,
            });

            expect(response.statusCode).toBe(204);
            expect(response.payload).toBe('');
        });

        it('debe retornar 404 si el pago no existe', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/payments/123e4567-e89b-12d3-a456-000000000000`,
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El pago ingresado no existe en el sistema');
        });

        it('debe retornar 409 si el pago ya fue eliminado', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/payments/${deletedPaymentId}`,
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El pago ya fue eliminado');
        });

        it('debe retornar 400 si el id no tiene formato UUID válido', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/payments/id-invalido`,
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El formato del ID es inválido');
        });
    });

});