import { test, expect } from '@playwright/test';

test.describe('Disciplines Full-Stack E2E', () => {

    test('debe crear un miembro y una disciplina real y mostrarla en la tabla', async ({ page }) => {
        await page.goto('/members');
        await page.locator('button:has-text("Agregar Miembro")').click();
        await page.getByPlaceholder('Ej. Juan Pérez').fill('Socio E2E Discipline');
        await page.getByPlaceholder('Ej. 12345678').fill('99988877');
        await page.getByPlaceholder('ejemplo@correo.com').fill('e2e@discipline.com');
        await page.getByLabel(/Fecha de Nacimiento/i).fill('1995-06-15');
        await page.getByRole('button', { name: 'Crear Miembro' }).click();
        await expect(page.getByRole('button', { name: 'Crear Miembro' })).toBeHidden();

        await page.goto('/disciplines');
        await expect(page.getByText('No se encontraron disciplinas registradas.')).toBeVisible({ timeout: 10000 });

        await page.locator('button:has-text("Generar Disciplina")').click();
        await expect(page.getByText('Generar Nueva Disciplina')).toBeVisible();

        await page.locator('select').first().selectOption({ label: 'Socio E2E Discipline (DNI: 99988877)' });

        await page.getByLabel(/Razón/i).fill('Conducta inapropiada E2E');

        await page.getByLabel(/Fecha de Fin/i).fill('2026-12-31');

        await page.locator('select').last().selectOption({ value: 'false' });

        await page.getByRole('button', { name: 'Generar' }).click();

        page.on('dialog', (dialog) => dialog.accept());

        await expect(page.getByText('Conducta inapropiada E2E')).toBeVisible({ timeout: 10000 });
    });

    test('debe eliminar la disciplina creada y mostrar el estado vacío', async ({ page }) => {
        await page.goto('/disciplines');

        await expect(page.getByText('Conducta inapropiada E2E')).toBeVisible({ timeout: 10000 });

        page.on('dialog', (dialog) => dialog.accept());

        await page.getByRole('button', { name: /Eliminar disciplina/i }).first().click();

        await expect(page.getByText('No se encontraron disciplinas registradas.')).toBeVisible({ timeout: 10000 });
    });

    test.afterAll(async ({ request }) => {
        const response = await request.get('http://localhost:3001/api/v1/socios');
        const body = await response.json();
        const member = body.data.find((m: any) => m.dni === '99988877');
        if (member) {
            await request.delete(`http://localhost:3001/api/v1/socios/${member.id}`);
        }
    });
});