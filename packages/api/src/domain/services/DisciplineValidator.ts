export class DisciplineValidator {

    async validateEndDate(start_date: string, end_date: string): Promise<void> {
        console.log("-> Strings recibidos:", { start_date, end_date }); 
        
        const start = new Date(start_date);
        const end = new Date(end_date);

        if (end <= start) {
            throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }
    }
}