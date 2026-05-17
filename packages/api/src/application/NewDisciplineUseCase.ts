import { ZodError } from "zod";
import { CreateDisciplineSchema } from "../domain/services/DisciplineSchema.js";
import { DisciplineRepository } from "../domain/DisciplineRepository.js";
import { MemberRepository } from "../domain/MemberRepository.js";
import { DisciplineValidator } from "../domain/services/DisciplineValidator.js";
import { Discipline, CreateDiscipline } from "@alentapp/shared";

export class CreateDisciplineUseCase {
    constructor(
        private readonly disciplineRepository: DisciplineRepository,
        private readonly disciplineValidator: DisciplineValidator,
        private readonly memberRepository: MemberRepository
    ) {}

    async execute(data: CreateDiscipline): Promise<Discipline> {
        try {
            CreateDisciplineSchema.parse(data);
        } catch (error) {
            if (error instanceof ZodError) {
                throw new Error(error.issues[0].message);
            }
        }

        await this.disciplineValidator.validateEndDate(data.startDate, data.endDate);

        const member = await this.memberRepository.findById(data.member_id);
        if (!member) {
            throw new Error('El miembro ingresado no existe en el sistema');
        }

        const nuevaDisciplina = await this.disciplineRepository.create({
            ...data,
            is_deleted: false, //Crea con is_deleted en false
        });

        return nuevaDisciplina;
    }
}