import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

vi.mock('../infrastructure/PostgresMedicalCertificateRepository.js', () => {
  return {
    PostgresMedicalCertificateRepository: class {
      async create(data: any) {
        return {
          id: 'cert-' + Math.random().toString(36).substr(2, 9),
          ...data,
          is_validated: true,
          is_deleted: false,
        };
      }

      async invalidatePriorCertificates(memberId: string) {
        return;
      }

      async findById(id: string) {
        if (id === 'c77bc10b-58cc-4372-a567-0e02b2c3d999') {
          return {
            id,
            member_id: '123e4567-e89b-12d3-a456-426614174000',
            issue_date: '2026-05-28T00:00:00.000Z',
            expiry_date: '2026-08-28T00:00:00.000Z',
            doctor_license: 'MN-998877',
          };
        }
        return null;
      }

      async findByMemberId(memberId: string) {
        return [];
      }

      async findByNumber(number: number) {
        return null;
      }

      async findAll() {
        return [];
      }

      async update(id: string, data: any) {
        return { id, ...data };
      }

      async delete(id: string) {
        return;
      }

      async releaseByMemberId(memberId: string) {
        return;
      }

      async softDeleteByMemberId(memberId: string) {
        return;
      }
    },
  };
});

// mocks
vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
  return {
    PostgresMemberRepository: class {
      async findById(id: string) {
        // Caso 1: Socio Activo 
        if (id === '123e4567-e89b-12d3-a456-426614174000') {
          return {
            id,
            name: 'Juan Perez',
            status: 'Activo',
            dni: '12345678',
            email: 'juan@test.com',
            birthdate: '1990-01-01',
            category: 'Pleno',
            created_at: new Date(),
          };
        }
        // Caso 2: Socio Suspendido
        if (id === '123e4567-e89b-12d3-a456-426614174999') {
          return {
            id,
            name: 'Socio Suspendido',
            status: 'Suspendido',
            dni: '87654321',
            email: 'suspendido@test.com',
            birthdate: '1990-01-01',
            category: 'Pleno',
            created_at: new Date(),
          };
        }
        // Caso 3: Socio inexistente
        return null;
      }

      async findAll() {
        return [];
      }

      async create(data: any) {
        return { id: '1', ...data };
      }

      async update(id: string, data: any) {
        return { id, ...data };
      }

      async delete(id: string) {
        return;
      }

      async findByDni(dni: string) {
        return null;
      }
    },
  };
});

vi.mock('../infrastructure/PostgresPaymentRepository.js', () => ({ PostgresPaymentRepository: class {} }));
vi.mock('../infrastructure/PostgresSportRepository.js', () => ({ PostgresSportRepository: class {} }));
vi.mock('../infrastructure/PostgresLockerRepository.js', () => ({ PostgresLockerRepository: class {} }));
vi.mock('../infrastructure/PostgresDisciplineRepository.js', () => ({ PostgresDisciplineRepository: class {} }));

// Tests

describe('MedicalCertificateController - Integration Tests (Funcionalidades CREATE y UPDATE)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/medical-certificates', () => {
    // Test 1
    it('[TEST 1] debe retornar 201 Created y crear el certificado médico para un socio activo', async () => {
      const payload = {
        member_id: '123e4567-e89b-12d3-a456-426614174000', 
        issue_date: '2026-05-28T00:00:00.000Z',
        expiry_date: '2026-08-28T00:00:00.000Z', 
        doctor_license: 'MN-998877',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/medical-certificates',
        payload,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);

      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('id');
      expect(body.data.member_id).toBe(payload.member_id);
      expect(body.data.issue_date).toBe(payload.issue_date);
      expect(body.data.expiry_date).toBe(payload.expiry_date);
      expect(body.data.doctor_license).toBe(payload.doctor_license);
      expect(body.data.is_validated).toBe(true);
    });

    // Test 2
    it('[TEST 2] debe retornar 404 Not Found si el socio no existe en el sistema', async () => {
      const payload = {
        member_id: '123e4567-e89b-12d3-a456-000000000000', 
        issue_date: '2026-05-28T00:00:00.000Z',
        expiry_date: '2026-08-28T00:00:00.000Z',
        doctor_license: 'MN-998877',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/medical-certificates',
        payload,
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.payload);

      expect(body).toHaveProperty('error');
      expect(body.error).toContain('Socio inexistente');
    });

    // Test 3
    it('[TEST 3] debe retornar 400 Bad Request si el socio se encuentra Suspendido', async () => {
      const payload = {
        member_id: '123e4567-e89b-12d3-a456-426614174999', // Socio Suspendido
        issue_date: '2026-05-28T00:00:00.000Z',
        expiry_date: '2026-08-28T00:00:00.000Z',
        doctor_license: 'MN-998877',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/medical-certificates',
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);

      expect(body).toHaveProperty('message');
      expect(body.message).toContain(
        'No se permiten realizar acciones sobre certificados médicos de un socio suspendido'
      );
    });

    // Test 4
    it('[TEST 4] debe retornar 400 Bad Request si expiry_date es anterior o igual a issue_date', async () => {
      const payload = {
        member_id: '123e4567-e89b-12d3-a456-426614174000', 
        issue_date: '2026-06-15T00:00:00.000Z',
        expiry_date: '2026-06-10T00:00:00.000Z', 
        doctor_license: 'MN-998877',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/medical-certificates',
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);

      expect(body).toHaveProperty('message');
      expect(body.message).toContain(
        'La fecha de vencimiento debe ser posterior a la de emisión'
      );
    });

    // Test 5
    it('[TEST 5] debe retornar 400 Bad Request si la fecha de vencimiento está en el pasado', async () => {
      const payload = {
        member_id: '123e4567-e89b-12d3-a456-426614174000', 
        issue_date: '2025-01-01T00:00:00.000Z',
        expiry_date: '2025-02-01T00:00:00.000Z', 
        doctor_license: 'MN-998877',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/medical-certificates',
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);

      expect(body).toHaveProperty('message');
      expect(body.message).toContain(
        'No se puede cargar un certificado con fecha de vencimiento pasada'
      );
    });
  });

  describe('PATCH /api/v1/medical-certificates/:id', () => {
    // Test 6
    it('[TEST 6] debe retornar 200 OK y actualizar los campos correctamente', async () => {
      const certId = 'c77bc10b-58cc-4372-a567-0e02b2c3d999';
      const payload = {
        expiry_date: '2026-12-31T00:00:00.000Z',
        is_validated: true
      };

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/medical-certificates/${certId}`,
        payload,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);

      expect(body).toHaveProperty('data');
      expect(body.data.id).toBe(certId);
      expect(body.data.expiry_date).toBe(payload.expiry_date);
    });
  });
});