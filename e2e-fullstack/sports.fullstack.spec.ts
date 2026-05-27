import { test, expect } from '@playwright/test'

test.describe('Sports Full-Stack E2E', () => {
    test('debe crear un deporte, eliminarlo y verificar que desaparece de la tabla', async ({ page }) =>{

        await page.goto('http://localhost:5173/sports');
        await page.locator('button:has-text("Agregar Deporte")').click();

        await page.getByPlaceholder('Ej. Fútbol').fill('Deporte Borrable');
        await page.getByPlaceholder('Ej. Deporte de equipo').fill('Descripción del deporte borrable');
        await page.getByPlaceholder('Ej. 20').fill('22');
        await page.getByPlaceholder('Ej. 10000').fill('10000');

        await page.getByRole('combobox', { name: 'Requiere Certificado Médico' }).click();
        await page.getByRole('option', { name: 'Sí' }).click();

        await page.getByRole('button', {name: 'Crear Deporte'}).click();
        
        await expect(page.getByText('Deporte Borrable', { exact: true })).toBeVisible({ timeout: 10000});

        page.on('dialog', (dialog) => dialog.accept());

        const filaDeporte = page.locator('tr').filter({ hasText: 'Deporte Borrable'});
        await filaDeporte.getByRole('button', { name: /Eliminar/i }).click();

        await expect(page.getByText('Deporte Borrable', { exact: true })).toBeHidden({ timeout: 10000});
    });
});