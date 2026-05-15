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

    // --- INSTANCIAS DE CERTIFICADOS MÉDICOS
    const certificateRepo = new PostgresMedicalCertificateRepository();
    const certificateValidator = new MedicalCertificateValidator();
    
    // El caso de uso necesita ambos repos para validar socio y persistir certificado
    const newCertificateUseCase = new NewMedicalCertificateUseCase(
        certificateRepo,
        memberRepo,
        certificateValidator
    );

    const certificateController = new MedicalCertificateController(newCertificateUseCase);

    server.get('/api/v1/socios', memberController.getAll.bind(memberController));
    server.post('/api/v1/socios', memberController.create.bind(memberController));
    server.put('/api/v1/socios/:id', memberController.update.bind(memberController));
    server.delete('/api/v1/socios/:id', memberController.delete.bind(memberController));

    // Rutas de Certificados Médicos
    server.post('/api/v1/medical-certificates', certificateController.create.bind(certificateController));

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