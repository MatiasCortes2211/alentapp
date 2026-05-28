import { test, expect } from '@playwright/test';

/**
 * Tests E2E Full-Stack para la vista de Pagos.
 * NO hay ningún mock de red. Playwright interactúa con:
 *   - El Frontend React en http://localhost:5173
 *   - La API Fastify real en http://localhost:3001
 *   - La base de datos PostgreSQL de test (alentapp_test_db)
 *
 * El global-setup se encarga de limpiar la DB antes de correr la suite,
 * por lo que cada test empieza desde un estado conocido y limpio.
 */

test.describe('Payments Full-Stack E2E', () => {

  test('debe mostrar el estado vacío cuando no hay pagos en la DB', async ({ page }) => {
    await page.goto('/payments');
    await expect(page.getByText('No se encontraron pagos registrados.')).toBeVisible({ timeout: 10000 });
  });

  test('debe crear un pago real y mostrarlo en la tabla', async ({ page }) => {
    await page.goto('/members');

    // Crear un miembro real para asociar el pago
    await page.locator('button:has-text("Agregar Miembro")').click();
    await expect(page.getByText('Agregar Nuevo Miembro')).toBeVisible();
    await page.getByPlaceholder('Ej. Juan Pérez').fill('Socio E2E Pago');
    await page.getByPlaceholder('Ej. 12345678').fill('425291416');
    await page.getByPlaceholder('ejemplo@correo.com').fill('socioe2epago@e2e.com');
    await page.getByLabel(/Fecha de Nacimiento/i).fill('1995-06-15');
    await page.getByRole('button', { name: 'Crear Miembro' }).click();
    await expect(page.getByRole('button', { name: 'Crear Miembro' })).toBeHidden();

    // Ir a pagos
    await page.goto('/payments');

    // Abrir modal de creación
    await page.locator('button:has-text("Generar Pago")').click();
    await expect(page.getByText('Generar Nuevo Pago')).toBeVisible();

    // Seleccionar el socio
    await page.locator('select').selectOption({ label: 'Socio E2E Pago (DNI: 425291416)' });

    // Llenar formulario con datos reales
    await page.getByLabel(/Monto/i).fill('7000');
    await page.getByLabel(/Mes/i).fill('6');
    await page.getByLabel(/Año/i).fill('2026');
    await page.getByLabel(/Fecha de Vencimiento/i).fill('2056-06-30');

    // Guardar
    page.on('dialog', (dialog) => dialog.accept()); // acepta el alert de éxito
    await page.getByRole('button', { name: 'Generar' }).click();

    // Verificar que el pago aparece en la tabla
    await expect(page.getByRole('cell', { name: /Socio E2E Pago/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: 'PENDING' })).toBeVisible();
  });

  test('debe fallar al crear un pago duplicado para el mismo socio, mes y año', async ({ page }) => {
    await page.goto('/payments');

    // Abrir modal
    await page.locator('button:has-text("Generar Pago")').click();
    await expect(page.getByText('Generar Nuevo Pago')).toBeVisible();

    // Mismo socio, mismo mes y año que el test anterior
    await page.locator('select').selectOption({ label: 'Socio E2E Pago (DNI: 425291416)' });
    await page.getByLabel(/Monto/i).fill('7000');
    await page.getByLabel(/Mes/i).fill('6');
    await page.getByLabel(/Año/i).fill('2026');
    await page.getByLabel(/Fecha de Vencimiento/i).fill('2056-06-30');

    await page.getByRole('button', { name: 'Generar' }).click();

    // Debe mostrar el error de duplicado
    await expect(page.getByText('Ya existe un pago activo para este socio en el mismo mes y año')).toBeVisible({ timeout: 10000 });
  });


  test('debe actualizar el pago a PAID y ver el cambio en la tabla', async ({ page }) => {
    await page.goto('/payments');

    // El pago del test anterior debería estar en PENDING
    await expect(page.getByRole('cell', { name: 'PENDING' })).toBeVisible({ timeout: 10000 });

    // Clic en Pagar
    await page.getByRole('button', { name: 'Pagar' }).first().click();

    // Verificar que el estado cambió a PAID
    await expect(page.getByRole('cell', { name: 'PAID' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: 'PENDING' })).toBeHidden();
  });

});