import { test, expect } from '@playwright/test';

test.describe('Lockers Full-Stack E2E', () => {
  test.describe.configure({ mode: 'serial' });

  // Un numero aleatorio y alto para no chocar con datos de prueba
  const testLockerNumber = '8888'; 

  test('1. Debe crear un casillero exitosamente y mostrarlo en la tabla', async ({ page }) => {
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
    await page.goto('/lockers');

    await page.locator('button:has-text("Agregar Casillero")').click();
    
    // Intenta poner el mismo numero
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
    await page.goto('/lockers');

    // Busca la fila del casillero de prueba
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

});