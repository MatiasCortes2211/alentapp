import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../application/NewSportUseCase.js';
import { GetSportsUseCase } from '../application/GetSportsUseCase.js';
import { UpdateSportUseCase } from '../application/UpdateSportUseCase.js';
import { DeleteSportUseCase } from '../application/DeleteSportUseCase.js';
import { CreateSport, UpdateSport } from '@alentapp/shared';

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly updateSportUseCase: UpdateSportUseCase,
        private readonly getSportsUseCase: GetSportsUseCase,
        private readonly deleteSportUseCase: DeleteSportUseCase,
    ) {}

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const sports = await this.getSportsUseCase.execute();
            return reply.status(200).send({ data: sports });
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateSport }>,
        reply: FastifyReply
    ){
        try {
            const sport = await this.createSportUseCase.execute(request.body);
            return reply.status(201).send({ data: sport });
        } catch (error: any) {
            const zodErrors = [
                "El nombre es obligatorio.",
                "La descripción es obligatoria.",
                "La capacidad máxima es obligatoria.",
                "El precio adicional es obligatorio.",
                "El requisito de certificado médico es obligatorio.",
                "El nombre no puede estar vacío.",
                "La descripción no puede estar vacía.",
                "La capacidad máxima debe ser mayor a 0.",
                "El precio adicional debe ser mayor o igual a $0.",
                "El requisito de certificado médico debe ser un valor booleano válido."
            ];

            if (zodErrors.some(msg => error.message.includes(msg))) {
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('Ya existe un deporte con ese nombre.')) {
                return reply.status(409).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Ocurrió un error inesperado. Por favor, intentá de nuevo más tarde.' });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }, Body: UpdateSport }>,
        reply: FastifyReply
    ) {
        try {
            const sport = await this.updateSportUseCase.execute(request.params.id, request.body);
            return reply.status(200).send({ data: sport });
        } catch (error: any) {
            const zodErrors = [
                "El ID es obligatorio.",
                "La descripción no puede estar vacía.",
                "La capacidad máxima debe ser mayor a 0.",
                "ID inválido."
            ];
            
            if (zodErrors.some(msg => error.message.includes(msg))) {
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('El deporte no existe.')) {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('La capacidad máxima no puede ser menor a la cantidad de inscriptos activos.')) {
                return reply.status(409).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Ocurrió un error inesperado. Por favor, intentá de nuevo más tarde.' });
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;
            await this.deleteSportUseCase.execute(id);
            return reply.status(204).send();
        } catch (error: any) {
            const zodErrors = [
                "El ID es obligatorio.",
                "ID inválido."
            ];
            if (zodErrors.some(msg => error.message.includes(msg))) {
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('El deporte no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('El deporte ya está eliminado.')) {
                return reply.status(409).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Ocurrió un error inesperado. Por favor, intentá de nuevo más tarde.' });
        }
    }
}