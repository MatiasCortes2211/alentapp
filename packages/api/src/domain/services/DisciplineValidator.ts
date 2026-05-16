export class DisciplineValidator {

    validateEndDate(startDate: string, endDate: string): void {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        if (end <= start || end <= today) {
            throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }
    }
}