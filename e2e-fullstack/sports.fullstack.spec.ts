import { test, expect } from '@playwright/test'

test.describe('Sports Full-Stack E2E', () => {

    test('1 debe crear un deporte si los datos son válidos y max_capacity > 0', async ({ page }) => {
        const randomSuffix = Math.floor(Math.random() * 100000).toString();
        const sportName = `Vóley ${randomSuffix}`;

        await page.goto('/sports');
        await page.locator('button:has-text("Agregar Deporte")').click();

        await page.getByPlaceholder('Ej. Fútbol').fill(sportName);
        await page.getByPlaceholder('Ej. Deporte de equipo').fill('Descripción válida');
        await page.getByPlaceholder('Ej. 20').fill('15');
        await page.getByPlaceholder('Ej. 10000').fill('2000');
        await page.getByRole('combobox', { name: 'Requiere Certificado Médico' }).click();
        await page.getByRole('option', { name: 'Sí' }).click();

        await page.getByRole('button', { name: 'Crear Deporte' }).click();
        
        await expect(page.getByText(sportName, { exact: true })).toBeVisible({ timeout: 10000 });
    });

    test('2 debe fallar por datos faltantes', async ({ page }) => {
        await page.goto('/sports');
        await page.locator('button:has-text("Agregar Deporte")').click();

        await page.getByPlaceholder('Ej. Deporte de equipo').fill('Descripción sin nombre');
        await page.getByPlaceholder('Ej. 20').fill('10');
        await page.getByPlaceholder('Ej. 10000').fill('5000');

        await page.getByRole('button', { name: 'Crear Deporte' }).click();
        
        const inputNombre = page.getByPlaceholder('Ej. Fútbol');
        
        const mensajeNativo = await inputNombre.evaluate((el: HTMLInputElement) => el.validationMessage);
        
        expect(mensajeNativo).toMatch(/Completa este campo|Please fill out this field/);
    });

    test('3 debe fallar si max_capacity es menor o igual a 0', async ({ page }) => {
        const randomSuffix = Math.floor(Math.random() * 100000).toString();
        
        await page.goto('/sports');
        await page.locator('button:has-text("Agregar Deporte")').click();

        await page.getByPlaceholder('Ej. Fútbol').fill(`Natación ${randomSuffix}`);
        await page.getByPlaceholder('Ej. Deporte de equipo').fill('Descripción');
        await page.getByPlaceholder('Ej. 20').fill('0');
        await page.getByPlaceholder('Ej. 10000').fill('4000');

        await page.getByRole('button', { name: 'Crear Deporte' }).click();
        
        const inputNombre = page.getByPlaceholder('Ej. 20');
        
        const mensajeNativo = await inputNombre.evaluate((el: HTMLInputElement) => el.validationMessage);
        
        expect(mensajeNativo).toMatch(/Completa este campo|Please fill out this field/);
    });

    test('4 debe fallar si el nombre del deporte (activo) ya existe', async ({ page }) => {
        const randomSuffix = Math.floor(Math.random() * 100000).toString();
        const sportName = `Natación Duplicado ${randomSuffix}`;

        await page.goto('/sports');

        await page.locator('button:has-text("Agregar Deporte")').click();
        await page.getByPlaceholder('Ej. Fútbol').fill(sportName);
        await page.getByPlaceholder('Ej. Deporte de equipo').fill('Deporte original');
        await page.getByPlaceholder('Ej. 20').fill('30');
        await page.getByPlaceholder('Ej. 10000').fill('0');
        await page.getByRole('button', { name: 'Crear Deporte' }).click();
        await expect(page.getByText(sportName, { exact: true })).toBeVisible({ timeout: 10000 });

        await page.locator('button:has-text("Agregar Deporte")').click();
        await page.getByPlaceholder('Ej. Fútbol').fill(sportName);
        await page.getByPlaceholder('Ej. Deporte de equipo').fill('Deporte duplicado');
        await page.getByPlaceholder('Ej. 20').fill('15');
        await page.getByPlaceholder('Ej. 10000').fill('10000');
        await page.getByRole('button', { name: 'Crear Deporte' }).click();
        
        await expect(page.getByText('Agregar Nuevo Deporte')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Crear Deporte' })).toBeVisible();
    });

    test('5 debe actualizar la descripción y la capacidad de un deporte existente', async ({ page }) => {
        const randomSuffix = Math.floor(Math.random() * 100000).toString();
        const sportName = `Natación ${randomSuffix}`;

        await page.goto('/sports');

        await page.locator('button:has-text("Agregar Deporte")').click();
        await page.getByPlaceholder('Ej. Fútbol').fill(sportName);
        await page.getByPlaceholder('Ej. Deporte de equipo').fill('Deporte en agua');
        await page.getByPlaceholder('Ej. 20').fill('10');
        await page.getByPlaceholder('Ej. 10000').fill('1500');
        await page.getByRole('button', { name: 'Crear Deporte' }).click();
        await expect(page.getByText(sportName, { exact: true })).toBeVisible({ timeout: 10000 });

        const filaDeporte = page.locator('tr').filter({ hasText: sportName });
        await filaDeporte.getByRole('button', { name: /Editar/i }).click(); 

        await page.getByLabel('Descripción').fill('Deporte en aire');
        await page.getByLabel('Cupo Máximo').fill('25');
        
        await page.getByRole('button', { name: 'Guardar Cambios' }).click();

        await expect(filaDeporte.getByText('Deporte en aire')).toBeVisible({ timeout: 10000 });
        await expect(filaDeporte.getByText('25')).toBeVisible();
    });

    test('6 el formulario de edición no debe permitir modificar campos inmutables', async ({ page }) => {
        const randomSuffix = Math.floor(Math.random() * 100000).toString();
        const sportName = `Natación ${randomSuffix}`;

        await page.goto('/sports');
        await page.locator('button:has-text("Agregar Deporte")').click();
        await page.getByPlaceholder('Ej. Fútbol').fill(sportName);
        await page.getByPlaceholder('Ej. Deporte de equipo').fill('Natación y música');
        await page.getByPlaceholder('Ej. 20').fill('30');
        await page.getByPlaceholder('Ej. 10000').fill('0');
        await page.getByRole('button', { name: 'Crear Deporte' }).click();
        await expect(page.getByText(sportName, { exact: true })).toBeVisible({ timeout: 10000 });

        const filaDeporte = page.locator('tr').filter({ hasText: sportName });
        await filaDeporte.getByRole('button', { name: /Editar/i }).click();

        await expect(page.getByLabel('Nombre')).toBeDisabled();
        await expect(page.getByLabel('Precio Adicional')).toBeDisabled();
        await expect(page.getByLabel('Requiere Certificado Médico')).toBeDisabled();
    });

    test('7 la edición debe fallar si se intenta poner una capacidad de 0', async ({ page }) => {
        const randomSuffix = Math.floor(Math.random() * 100000).toString();
        const sportName = `Natación ${randomSuffix}`;

        await page.goto('/sports');
        await page.locator('button:has-text("Agregar Deporte")').click();
        await page.getByPlaceholder('Ej. Fútbol').fill(sportName);
        await page.getByPlaceholder('Ej. Deporte de equipo').fill('Natación con patines');
        await page.getByPlaceholder('Ej. 20').fill('14');
        await page.getByPlaceholder('Ej. 10000').fill('2000');
        await page.getByRole('button', { name: 'Crear Deporte' }).click();
        await expect(page.getByText(sportName, { exact: true })).toBeVisible({ timeout: 10000 });

        const filaDeporte = page.locator('tr').filter({ hasText: sportName });
        await filaDeporte.getByRole('button', { name: /Editar/i }).click();
        
        const inputCapacidad = page.getByLabel('Cupo Máximo');
        
        await inputCapacidad.fill('0');
        
        let mensajeAlert = '';
        page.once('dialog', async (dialog) => {
            mensajeAlert = dialog.message();
            await dialog.accept();
        });

        await page.getByRole('button', { name: 'Guardar Cambios' }).click();

        expect(mensajeAlert).toBe('La capacidad máxima debe ser mayor a 0.');
    });

    test('8 debe crear un deporte, eliminarlo y verificar que desaparece de la tabla', async ({ page }) =>{

        await page.goto('/sports');
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