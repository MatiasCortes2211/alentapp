export class DisciplineValidator {

    async validateEndDate(start_date: string, end_date: string): Promise<void> {
        console.log("-> Strings recibidos:", { start_date, end_date }); 


        const start = new Date(start_date);
        const end = new Date(end_date);
        const today = new Date();
        // 2. Log para ver cómo interpretó JavaScript esos strings
        console.log("-> Fechas parseadas (ISO):", {
        start: start.toISOString(),
        end: end.toISOString(),
        today: today.toISOString()
    });
        if (end <= start) {
            throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }
    }
}