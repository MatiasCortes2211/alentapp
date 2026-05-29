import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisciplineValidator } from './DisciplineValidator.js';

describe('DisciplineValidator', () => {
    const validator = new DisciplineValidator();

    describe('validateEndDate', () => {
        it('debe pasar correctamente si la fecha de fin es mayor a la de inicio', async() => {
            await expect(validator.validateEndDate('2026-01-01', '2026-12-31')).resolves.not.toThrow();
        });
        it('debe lanzar un error si la fecha de fin es menor a la de inicio', async() => {
            await expect(() => validator.validateEndDate('2026-12-31', '2026-01-01')).rejects.toThrow('La fecha de fin debe ser posterior a la fecha de inicio');
        });
        it('debe lanzar un error si la fecha de fin es igual a la de inicio', async() => {
            await expect(() => validator.validateEndDate('2026-01-01', '2026-01-01')).rejects.toThrow('La fecha de fin debe ser posterior a la fecha de inicio');
        });
    });

    describe('validateDisciplineValidity', () => {
        const today = new Date();
        it('debe devolver true si la fecha de hoy es menor a la fecha de fin', async () => {
            const futureDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0]; //Creamos una fecha que siempre sea futura para que el test sea robusto    
            const result = await validator.validateDisciplineValidity(futureDate);
            expect(result).toBe(true);
        });
        it('debe devolver false si la fecha de hoy es mayor a la fecha de fin', async () => {
            const pastDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0]; //Creamos una fecha que siempre sea pasada para que el test sea robusto
            const result = await validator.validateDisciplineValidity(pastDate);
            expect(result).toBe(false);
        });
    });
 
});