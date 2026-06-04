import { test, expect } from '@playwright/test';

test.describe('Lockers Full-Stack E2E', () => {

  test('1. Debe crear un casillero exitosamente y mostrarlo en la tabla', async ({ page }) => {
    // Genera un numero aleatorio y alto
    const testLockerNumber = Math.floor(Math.random() * 9000 + 1000).toString();
    
    await page.goto('/lockers');

    // Abrir modal
    await page.locator('button:has-text("Agregar Casillero")').click();
    await expect(page.getByText('Agregar Nuevo Casillero')).toBeVisible();

    // Llenar numero
    await page.getByPlaceholder('Ej. 101').fill(testLockerNumber);

    // Seleccionar ubicacion
    await page.getByRole('combobox', { name: 'Ubicación' }).click();
    await page.getByRole('option', { name: 'Vestuario Femenino' }).click();

    // Seleccionar estado
    await page.getByRole('combobox', { name: 'Estado' }).click();
    await page.getByRole('option', { name: 'Disponible' }).click();

    // Guardar
    await page.getByRole('button', { name: 'Crear Casillero' }).click();

    // Verificar que aparece en la tabla con el formato correcto
    await expect(page.getByText(`#${testLockerNumber}`, { exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('2. Debe dar error al intentar crear un casillero con un número duplicado', async ({ page }) => {
    // Genera un numero aleatorio y alto
    const testLockerNumber = Math.floor(Math.random() * 9000 + 1000).toString();
    
    await page.goto('/lockers');

    // Crea el primer casillero
    await page.locator('button:has-text("Agregar Casillero")').click();
    await page.getByPlaceholder('Ej. 101').fill(testLockerNumber);
    await page.getByRole('combobox', { name: 'Ubicación' }).click();
    await page.getByRole('option', { name: 'Vestuario Femenino' }).click();
    await page.getByRole('button', { name: 'Crear Casillero' }).click();
    await expect(page.getByText(`#${testLockerNumber}`, { exact: true })).toBeVisible({ timeout: 10000 });

    // Intenta crear otro casillero con el mismo numero
    await page.locator('button:has-text("Agregar Casillero")').click();
    await page.getByPlaceholder('Ej. 101').fill(testLockerNumber);
    
    // Seleccionar ubicacion
    await page.getByRole('combobox', { name: 'Ubicación' }).click();
    await page.getByRole('option', { name: 'Niños' }).click();

    // Seleccionar estado
    await page.getByRole('combobox', { name: 'Estado' }).click();
    await page.getByRole('option', { name: 'Disponible' }).click();

    page.once('dialog', async (dialog) => {
        expect(dialog.message()).toContain('Ya existe un casillero');
        await dialog.accept();
    });

    await page.getByRole('button', { name: 'Crear Casillero' }).click();
  });

  test('3. Debe editar el estado del casillero a Mantenimiento', async ({ page }) => {
    // Genera un numero aleatorio y alto
    const testLockerNumber = Math.floor(Math.random() * 9000 + 1000).toString();
    
    await page.goto('/lockers');

    // Crea un casillero
    await page.locator('button:has-text("Agregar Casillero")').click();
    await page.getByPlaceholder('Ej. 101').fill(testLockerNumber);
    await page.getByRole('combobox', { name: 'Ubicación' }).click();
    await page.getByRole('option', { name: 'Vestuario Masculino' }).click();
    await page.getByRole('button', { name: 'Crear Casillero' }).click();
    await expect(page.getByText(`#${testLockerNumber}`, { exact: true })).toBeVisible({ timeout: 10000 });

    // Busca la fila del casillero de prueba creado
    const filaLocker = page.locator('tr').filter({ hasText: `#${testLockerNumber}` });
    
    await filaLocker.locator('button').first().click();
    await expect(page.getByText('Editar Casillero')).toBeVisible();
    
    // Cambia el estado
    await page.getByRole('combobox', { name: 'Estado' }).click();
    await page.getByRole('option', { name: 'Mantenimiento' }).click();
    
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    // Verifica que la etiqueta "Maintenance" aparece en la tabla
    await expect(filaLocker.getByText('Maintenance')).toBeVisible({ timeout: 10000 });
  });

  test('4. Debe eliminar el casillero y desaparecer de la tabla', async ({ page }) => {
    // Genera un numero aleatorio y alto
    const testLockerNumber = Math.floor(Math.random() * 9000 + 1000).toString();
    
    await page.goto('/lockers');
    
    // Crea un casillero
    await page.locator('button:has-text("Agregar Casillero")').click();
    await page.getByPlaceholder('Ej. 101').fill(testLockerNumber);
    await page.getByRole('combobox', { name: 'Ubicación' }).click();
    await page.getByRole('option', { name: 'Niños' }).click();
    await page.getByRole('button', { name: 'Crear Casillero' }).click();
    await expect(page.getByText(`#${testLockerNumber}`, { exact: true })).toBeVisible({ timeout: 10000 });
    
    // Busca la fila del casillero de prueba creado
    const filaLocker = page.locator('tr').filter({ hasText: `#${testLockerNumber}` });
    page.once('dialog', (dialog) => dialog.accept());
    
    // Hace click en el segundo boton de la fila (el tacho de basura)
    await filaLocker.locator('button').nth(1).click();

    // Verifica que el casillero desaparece de la tabla
    await expect(page.getByText(`#${testLockerNumber}`, { exact: true })).toBeHidden({ timeout: 10000 });
  });
  
});