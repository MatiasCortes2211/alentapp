import Fastify from 'fastify';
import cors from '@fastify/cors';

import { PostgresMemberRepository } from './infrastructure/PostgresMemberRepository.js';
import { MemberValidator } from './domain/services/MemberValidator.js';
import { CreateMemberUseCase } from './application/NewMemberUseCase.js';
import { GetMembersUseCase } from './application/GetMembersUseCase.js';
import { UpdateMemberUseCase } from './application/UpdateMemberUseCase.js';
import { DeleteMemberUseCase } from './application/DeleteMemberUseCase.js';
import { MemberController } from './delivery/MemberController.js';

import { PostgresMedicalCertificateRepository } from './infrastructure/PostgresMedicalCertificateRepository.js';
import { MedicalCertificateValidator } from './domain/services/MedicalCertificateValidator.js';
import { NewMedicalCertificateUseCase } from './application/NewMedicalCertificateUseCase.js';
import { GetMedicalCertificatesUseCase } from './application/GetMedicalCertificatesUseCase.js'; 
import { UpdateMedicalCertificateUseCase } from './application/UpdateMedicalCertificateUseCase.js'; 
import { MedicalCertificateController } from './delivery/MedicalCertificateController.js';

import { PostgresLockerRepository } from './infrastructure/PostgresLockerRepository.js';
import { LockerValidator } from './domain/services/LockerValidator.js';
import { CreateLockerUseCase } from './application/NewLockerUseCase.js';
import { GetLockersUseCase } from './application/GetLockersUseCase.js';
import { UpdateLockerUseCase } from './application/UpdateLockerUseCase.js';
import { DeleteLockerUseCase } from './application/DeleteLockerUseCase.js';
import { LockerController } from './delivery/LockerController.js';

import { PostgresPaymentRepository } from './infrastructure/PostgresPaymentRepository.js';
import { PaymentValidator } from './domain/services/PaymentValidator.js'; 
import { CreatePaymentUseCase } from './application/NewPaymentUseCase.js'; 
import { PaymentController } from './delivery/PaymentController.js'; 
import { GetPaymentsUseCase } from './application/GetPaymentsUseCase.js';
import { DeletePaymentUseCase } from './application/DeletePaymentUseCase.js';
import { UpdatePaymentUseCase } from './application/UpdatePaymentUseCase.js';

import { PostgresSportRepository } from './infrastructure/PostgresSportRepository.js';
import { SportValidator } from './domain/services/SportValidator.js';
import { CreateSportUseCase } from './application/NewSportUseCase.js';
import { GetSportsUseCase } from './application/GetSportsUseCase.js';
import { UpdateSportUseCase } from './application/UpdateSportUseCase.js';
import { DeleteSportUseCase } from './application/DeleteSportUseCase.js';
import { SportController } from './delivery/SportController.js';

import { PostgresDisciplineRepository } from './infrastructure/PostgresDisciplineRepository.js';
import { DisciplineValidator } from './domain/services/DisciplineValidator.js';
import { CreateDisciplineUseCase } from './application/NewDisciplineUseCase.js';
import { DisciplineController } from './delivery/DisciplineController.js';
import { GetDisciplineUseCase } from './application/GetDisciplineUseCase.js';
import { DeleteDisciplineUseCase } from './application/DeleteDisciplineUseCase.js';

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
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
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
    const getLockersUseCase = new GetLockersUseCase(lockerRepo);
    const updateLockerUseCase = new UpdateLockerUseCase(lockerRepo, memberRepo, lockerValidator);
    const deleteLockerUseCase = new DeleteLockerUseCase(lockerRepo);

    // ✅ CORREGIDO: Una única declaración con todas las dependencias
    const lockerController = new LockerController(
        createLockerUseCase, 
        getLockersUseCase, 
        updateLockerUseCase,
        deleteLockerUseCase,
    );
    
    // MedicalCertificate
    const certificateRepo = new PostgresMedicalCertificateRepository();
    const certificateValidator = new MedicalCertificateValidator();
    
    const newCertificateUseCase = new NewMedicalCertificateUseCase(
        certificateRepo,
        memberRepo,
        certificateValidator
    );

    const getMedicalCertificatesUseCase = new GetMedicalCertificatesUseCase(certificateRepo, memberRepo);
    const updateMedicalCertificateUseCase = new UpdateMedicalCertificateUseCase(certificateRepo);

    const certificateController = new MedicalCertificateController(
        newCertificateUseCase,
        getMedicalCertificatesUseCase,
        updateMedicalCertificateUseCase
    );

    // Payment
    const paymentRepo = new PostgresPaymentRepository();
    const paymentValidator = new PaymentValidator(paymentRepo);
    
    const createPaymentUseCase = new CreatePaymentUseCase(paymentRepo, memberRepo, paymentValidator);
    const getPaymentsUseCase = new GetPaymentsUseCase(paymentRepo); 
    const deletePaymentUseCase = new DeletePaymentUseCase(paymentRepo);
    const updatePaymentUseCase = new UpdatePaymentUseCase(paymentRepo, paymentValidator);

    // ✅ CORREGIDO: Una única declaración con todas las dependencias nuevas de main
    const paymentController = new PaymentController(
        createPaymentUseCase, 
        getPaymentsUseCase, 
        deletePaymentUseCase, 
        updatePaymentUseCase
    );

    // Sport
    const sportRepo = new PostgresSportRepository();
    const sportValidator = new SportValidator(sportRepo);

    const createSportUseCase = new CreateSportUseCase(sportRepo, sportValidator);
    const getSportsUseCase = new GetSportsUseCase(sportRepo);
    const updateSportUseCase = new UpdateSportUseCase(sportRepo, sportValidator);
    const deleteSportUseCase = new DeleteSportUseCase(sportRepo);
    
    const sportController = new SportController(
        createSportUseCase,
        updateSportUseCase,
        getSportsUseCase,
        deleteSportUseCase
    );

    // Configuration for Discipline
    const disciplineRepo = new PostgresDisciplineRepository();
    const disciplineValidator = new DisciplineValidator();

    const createDisciplineUseCase = new CreateDisciplineUseCase(disciplineRepo, disciplineValidator, memberRepo);
    const getDisciplineUseCase = new GetDisciplineUseCase(disciplineRepo);
    const deleteDisciplineUseCase = new DeleteDisciplineUseCase(disciplineRepo);
    
    const disciplineController = new DisciplineController(
        createDisciplineUseCase,
        getDisciplineUseCase,
        deleteDisciplineUseCase
    );

    // Rutas Socios
    server.get('/api/v1/socios', memberController.getAll.bind(memberController));
    server.post('/api/v1/socios', memberController.create.bind(memberController));
    server.put('/api/v1/socios/:id', memberController.update.bind(memberController));
    server.delete('/api/v1/socios/:id', memberController.delete.bind(memberController));

    // Rutas Lockers
    server.post('/api/v1/lockers', lockerController.create.bind(lockerController));
    server.get('/api/v1/lockers', lockerController.getAll.bind(lockerController));
    server.patch('/api/v1/lockers/:id', lockerController.update.bind(lockerController));
    server.delete('/api/v1/lockers/:id', lockerController.delete.bind(lockerController));

    // Rutas Certificados Médicos
    server.post('/api/v1/medical-certificates', certificateController.create.bind(certificateController));
    server.get('/api/v1/medical-certificates/member/:memberId', certificateController.getByMember.bind(certificateController));
    server.patch('/api/v1/medical-certificates/:id', certificateController.update.bind(certificateController));

    // Rutas Pagos
    server.post('/api/v1/payments', paymentController.create.bind(paymentController));
    server.get('/api/v1/payments', paymentController.getAll.bind(paymentController));
    server.delete('/api/v1/payments/:id', paymentController.delete.bind(paymentController));
    server.patch('/api/v1/payments/:id', paymentController.update.bind(paymentController));

    // Rutas Deportes
    server.post('/api/v1/sports', sportController.create.bind(sportController));
    server.get('/api/v1/sports', sportController.getAll.bind(sportController));
    server.patch('/api/v1/sports/:id', sportController.update.bind(sportController));
    server.delete('/api/v1/sports/:id', sportController.delete.bind(sportController));

    // Rutas Discipline
    server.post('/api/v1/disciplines', disciplineController.create.bind(disciplineController));
    server.get('/api/v1/disciplines', disciplineController.findAll.bind(disciplineController));
    server.delete('/api/v1/disciplines/:id', disciplineController.delete.bind(disciplineController));

    server.get('/', async (req, rep) => {
        rep.status(200).send({ msg: 'asd' })
    });

    return server;
}

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