import Fastify from 'fastify';
import cors from '@fastify/cors';

import { PostgresMemberRepository } from './infrastructure/PostgresMemberRepository.js';
import { MemberValidator } from './domain/services/MemberValidator.js';
import { CreateMemberUseCase } from './application/NewMemberUseCase.js';
import { GetMembersUseCase } from './application/GetMembersUseCase.js';
import { UpdateMemberUseCase } from './application/UpdateMemberUseCase.js';
import { DeleteMemberUseCase } from './application/DeleteMemberUseCase.js';
import { MemberController } from './delivery/MemberController.js';
// Imports de Certificados Médicos
import { PostgresMedicalCertificateRepository } from './infrastructure/PostgresMedicalCertificateRepository.js';
import { MedicalCertificateValidator } from './domain/services/MedicalCertificateValidator.js';
import { NewMedicalCertificateUseCase } from './application/NewMedicalCertificateUseCase.js';
import { MedicalCertificateController } from './delivery/MedicalCertificateController.js';

import { PostgresLockerRepository } from './infrastructure/PostgresLockerRepository.js';
import { LockerValidator } from './domain/services/LockerValidator.js';
import { CreateLockerUseCase } from './application/NewLockerUseCase.js';
import { LockerController } from './delivery/LockerController.js';

import { PostgresPaymentRepository } from './infrastructure/PostgresPaymentRepository.js';
import { PaymentValidator } from './domain/services/PaymentValidator.js'; 
import { CreatePaymentUseCase } from './application/NewPaymentUseCase.js'; 
import { PaymentController } from './delivery/PaymentController.js'; 
import { GetPaymentsUseCase } from './application/GetPaymentsUseCase.js';
import { DeletePaymentUseCase } from './application/DeletePaymentUseCase.js';

import { PostgresSportRepository } from './infrastructure/PostgresSportRepository.js';
import { SportValidator } from './domain/services/SportValidator.js';
import { CreateSportUseCase } from './application/NewSportUseCase.js';
import { GetSportsUseCase } from './application/GetSportsUseCase.js';
import { SportController } from './delivery/SportController.js';

export function buildApp() {
    const server = Fastify({
        logger: {
            level: 'info',
            transport: process.env.NODE_ENV === 'development' 
            ? {
                target: 'pino-pretty',
                options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
                } 
            : undefined,
        },
    });

    server.register(cors, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });

    const memberRepo = new PostgresMemberRepository();
    const memberValidator = new MemberValidator(memberRepo);
    
    const createMemberUseCase = new CreateMemberUseCase(memberRepo, memberValidator);
    const getMembersUseCase = new GetMembersUseCase(memberRepo);
    const updateMemberUseCase = new UpdateMemberUseCase(memberRepo, memberValidator);
    const deleteMemberUseCase = new DeleteMemberUseCase(memberRepo);

    const memberController = new MemberController(
        createMemberUseCase, 
        getMembersUseCase,
        updateMemberUseCase,
        deleteMemberUseCase
    );

    // Locker
    const lockerRepo = new PostgresLockerRepository();
    const lockerValidator = new LockerValidator(lockerRepo);
    
    const createLockerUseCase = new CreateLockerUseCase(lockerRepo, memberRepo, lockerValidator);

    const lockerController = new LockerController(createLockerUseCase);
    
    // MedicalCertificate
    const certificateRepo = new PostgresMedicalCertificateRepository();
    const certificateValidator = new MedicalCertificateValidator();
    
    // El caso de uso necesita ambos repos para validar socio y persistir certificado
    const newCertificateUseCase = new NewMedicalCertificateUseCase(
        certificateRepo,
        memberRepo,
        certificateValidator
    );

    const certificateController = new MedicalCertificateController(newCertificateUseCase);

    // Payment
    const paymentRepo = new PostgresPaymentRepository();
    const paymentValidator = new PaymentValidator(paymentRepo);
    
    const createPaymentUseCase = new CreatePaymentUseCase(paymentRepo, memberRepo, paymentValidator);
    const getPaymentsUseCase = new GetPaymentsUseCase(paymentRepo); 
    const deletePaymentUseCase = new DeletePaymentUseCase(paymentRepo);

    const paymentController = new PaymentController(createPaymentUseCase, getPaymentsUseCase, deletePaymentUseCase);

    // Sport
    const sportRepo = new PostgresSportRepository();
    const sportValidator = new SportValidator(sportRepo);

    const createSportUseCase = new CreateSportUseCase(sportRepo, sportValidator);
    const getSportsUseCase = new GetSportsUseCase(sportRepo);
    const sportController = new SportController(
        createSportUseCase,
        getSportsUseCase
    );

    server.get('/api/v1/socios', memberController.getAll.bind(memberController));
    server.post('/api/v1/socios', memberController.create.bind(memberController));
    server.put('/api/v1/socios/:id', memberController.update.bind(memberController));
    server.delete('/api/v1/socios/:id', memberController.delete.bind(memberController));

    server.post('/api/v1/lockers', lockerController.create.bind(lockerController));

    server.post('/api/v1/medical-certificates', certificateController.create.bind(certificateController));
    
    server.post('/api/v1/payments', paymentController.create.bind(paymentController));
    server.get('/api/v1/payments', paymentController.getAll.bind(paymentController));
    server.delete('/api/v1/payments/:id', paymentController.delete.bind(paymentController));

    server.post('/api/v1/sports', sportController.create.bind(sportController));
    server.get('/api/v1/sports', sportController.getAll.bind(sportController));

    server.get('/', async (req, rep) => {
        rep.status(200).send({ msg: 'asd' })
    });

    return server;
}

// Solo iniciar el servidor si el script se ejecuta directamente (no cuando es importado por vitest)
if (process.argv[1] && process.argv[1].endsWith('app.ts')) {
    const server = buildApp();
    const port = parseInt(process.env.PORT || '3000', 10);

    server.listen({ port, host: '0.0.0.0' }, () =>
        server.log.info(`API server running on http://localhost:${port}`)
    );

    ['SIGINT', 'SIGTERM'].forEach((signal) => {
        process.on(signal, async () => {
            await server.close();
            process.exit(0);
        });
    });
}