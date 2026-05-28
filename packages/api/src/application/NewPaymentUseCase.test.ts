import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreatePaymentUseCase } from './NewPaymentUseCase.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { PaymentValidator } from '../domain/services/PaymentValidator.js';
import { PaymentStatus, CreatePaymentRequest } from '@alentapp/shared';

describe('CreatePaymentUseCase', () => {
    // 1. Creamos Mocks de nuestras dependencias (Puertos y Servicios)
    const mockPaymentRepo = {
        create: vi.fn(),
        findActiveByMemberMonthYear: vi.fn(),
    } as unknown as PaymentRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const mockPaymentValidator = {
        validateDueDate: vi.fn(),
        validateNoDuplicateActivePayment: vi.fn(),
        validateMemberIsNotSuspended: vi.fn(),
    } as unknown as PaymentValidator;
    
    // 2. Instanciamos el caso de uso inyectando los mocks
    const useCase = new CreatePaymentUseCase(mockPaymentRepo, mockMemberRepo, mockPaymentValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Request base válida reutilizable en todos los tests
    const validRequest: CreatePaymentRequest = {
        amount: 5000,
        month: 6,
        year: 2026,
        due_date: '2026-06-30',
        member_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    // Mock de socio activo con el mismo ID de la request
    const mockMemberActivo = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Juan Perez',
        status: 'Activo',
    };

    // Mock del pago creado que devuelve el repositorio en estado PENDING y payment_date null
    const mockPaymentCreado = {
        id: 'uuid-payment-1',
        ...validRequest,
        status: PaymentStatus.Pending,
        payment_date: null,
        is_deleted: false,
    };

    it('debe crear el pago exitosamente con status PENDING y payment_date null', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(mockMemberActivo as any);
        vi.mocked(mockPaymentRepo.create).mockResolvedValueOnce(mockPaymentCreado as any);

        const result = await useCase.execute(validRequest);

        //Verifica que fue a buscar la info correcta
        expect(mockMemberRepo.findById).toHaveBeenCalledWith(validRequest.member_id);
        //Verifica que se aplicaron las reglas de negocio
        expect(mockPaymentValidator.validateMemberIsNotSuspended).toHaveBeenCalledWith(mockMemberActivo.status);
        expect(mockPaymentValidator.validateDueDate).toHaveBeenCalledWith(validRequest.due_date);
        expect(mockPaymentValidator.validateNoDuplicateActivePayment).toHaveBeenCalledWith(
            validRequest.member_id,
            validRequest.month,
            validRequest.year
        );

        expect(mockPaymentRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            status: PaymentStatus.Pending,
            payment_date: null,
            is_deleted: false,
        }));

        expect(result.status).toBe(PaymentStatus.Pending);
        expect(result.payment_date).toBeNull();
        expect(result.id).toBe('uuid-payment-1');
    });

    it('debe fallar si faltan campos obligatorios (ej amount ausente)', async () => {
        const requestInvalida = { ...validRequest, amount: undefined } as any;
        await expect(useCase.execute(requestInvalida)).rejects.toThrow();
    });

    it('debe fallar si el monto es menor o igual a cero', async () => {
        const requestInvalida = { ...validRequest, amount: -100 };
        await expect(useCase.execute(requestInvalida)).rejects.toThrow('El monto debe ser mayor a cero');
    });

    it('debe fallar si el mes está fuera del rango 1-12', async () => {
        const requestInvalida = { ...validRequest, month: 13 };
        await expect(useCase.execute(requestInvalida)).rejects.toThrow('El mes debe estar entre 1 y 12');
    });

    it('debe fallar si la fecha de vencimiento es anterior a hoy', async () => {
        const requestVencida = { ...validRequest, due_date: '2023-01-01' };

        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(mockMemberActivo as any);
        vi.mocked(mockPaymentValidator.validateDueDate).mockImplementationOnce(() => {
            throw new Error('La fecha de vencimiento no puede ser anterior a hoy');
        });

        await expect(useCase.execute(requestVencida)).rejects.toThrow(
            'La fecha de vencimiento no puede ser anterior a hoy'
        );
    });

    it('debe fallar si el miembro no existe', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute(validRequest)).rejects.toThrow(
            'El miembro ingresado no existe en el sistema'
        );
        expect(mockPaymentRepo.create).not.toHaveBeenCalled();
    });

    it('debe fallar si ya existe un pago activo para ese miembro, mes y año', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(mockMemberActivo as any);
        vi.mocked(mockPaymentValidator.validateNoDuplicateActivePayment).mockRejectedValueOnce(
            new Error('Ya existe un pago activo para este socio en el mismo mes y año')
        );

        await expect(useCase.execute(validRequest)).rejects.toThrow(
            'Ya existe un pago activo para este socio en el mismo mes y año'
        );
        expect(mockPaymentRepo.create).not.toHaveBeenCalled();
    });
});