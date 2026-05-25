export class DisciplineValidator {

    async validateEndDate(start_date: string, end_date: string): Promise<void> { //Valida que la fecha de fin sea mayor a la fecha de inicio
        
        const start = new Date(start_date);
        const end = new Date(end_date);

        if (end <= start) {
            throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }
    }

    async validateDisciplineValidity(end_date: string): Promise<boolean> { //Valida que la fecha de fin no sea menor a la fecha actual
        
        const end = new Date(end_date);
        const now = new Date(); 

        if (end < now) {
            return false;
        }
        return true;
    }   
}