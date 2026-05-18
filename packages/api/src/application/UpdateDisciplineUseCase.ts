import { ZodError } from "zod";
import { UpdateDisciplineSchema } from "../domain/services/DisciplineSchema.js";
import { DisciplineRepository } from "../domain/DisciplineRepository.js";
import { MemberRepository } from "../domain/MemberRepository.js";
import { DisciplineValidator } from "../domain/services/DisciplineValidator.js";
import { Discipline, UpdateDiscipline } from "@alentapp/shared";

export class UpdateDisciplineUseCase {
    constructor(
        private readonly disciplineRepository: DisciplineRepository,
        private readonly disciplineValidator: DisciplineValidator,
        private readonly memberRepository: MemberRepository
    ) {}

    async execute(id: string, data: UpdateDiscipline): Promise<Discipline> {
        try {
            UpdateDisciplineSchema.parse(data);
        } catch (error) {
            if (error instanceof ZodError) {
                throw new Error(error.issues[0].message);
            }
            throw Error;
        }

        const discipline = await this.disciplineRepository.findById(id);
        if (!discipline) {
            throw new Error('La disciplina no existe');
        }
        if (discipline.is_deleted) {
            throw new Error('La disciplina no existe');
        }

        if (data.member_id) {
            const member = await this.memberRepository.findById(data.member_id);
            if (!member) {
                throw new Error('El miembro ingresado no existe en el sistema');
            }
        }

        const start_date = data.start_date ?? discipline.start_date;
        const end_date = data.end_date ?? discipline.end_date;
        await this.disciplineValidator.validateEndDate(start_date, end_date);

        return await this.disciplineRepository.update(id, data);
    }
}