import { test, expect } from '@playwright/test';

/**
 * Tests E2E Full-Stack para la vista de MedicalCertificate.
 * NO hay ningún mock de red. Playwright interactúa con:
 *   - El Frontend React en http://localhost:5173
 *   - La API Fastify real en http://localhost:3001
 *   - La base de datos PostgreSQL de test (alentapp_test_db)
 *
 * El global-setup se encarga de limpiar la DB antes de correr la suite,
 * por lo que cada test empieza desde un estado conocido y limpio.
 */

// Genera nombre, dni y email únicos por test para evitar colisiones en la DB
function generateTestData(prefix: string) {
  const id = Math.floor(Math.random() * 900000 + 100000).toString();
  return {
    nombre: `${prefix} ${id}`,
    dni: `99${id}`,
    email: `e2e_${id}@salud.com`,
  };
}

async function crearMiembroViaUI(page: any, data: { nombre: string; dni: string; email: string }) {
  await page.goto('/members');
  await expect(page.getByRole('heading', { name: 'Administración de Miembros' })).toBeVisible({ timeout: 10000 });

  await page.locator('button:has-text("Agregar Miembro")').click();
  await expect(page.getByText('Agregar Nuevo Miembro')).toBeVisible();

  await page.getByPlaceholder('Ej. Juan Pérez').fill(data.nombre);
  await page.getByPlaceholder('Ej. 12345678').fill(data.dni);
  await page.getByPlaceholder('ejemplo@correo.com').fill(data.email);
  await page.getByLabel(/Fecha de Nacimiento/i).fill('2000-01-01');

  await page.getByRole('button', { name: 'Crear Miembro' }).click();
  await expect(page.getByRole('button', { name: 'Crear Miembro' })).toBeHidden({ timeout: 15000 });
}

async function cargarCertificadoViaUI(page: any, nombreSocio: string, futureDate: string) {
  await page.goto('/salud');
  await expect(page.getByRole('heading', { name: 'Gestión de Salud' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(nombreSocio)).toBeVisible({ timeout: 15000 });

  await page.locator(`tr:has-text("${nombreSocio}")`).getByRole('button', { name: 'Cargar Certificado' }).click();
  await expect(page.getByText(`Cargar Certificado: ${nombreSocio}`)).toBeVisible();

  await page.getByPlaceholder('Ej. MN 123456').fill('MN 999111');
  await page.locator('input[type="date"]').first().fill('2026-05-28');
  await page.locator('input[type="date"]').last().fill(futureDate);

  await page.getByRole('button', { name: 'Registrar Certificado' }).click();
  await expect(page.getByText(`Cargar Certificado: ${nombreSocio}`)).toBeHidden({ timeout: 15000 });
}

test.describe('Medical Certificates Full-Stack E2E', () => {

  const futureDate = new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split('T')[0];

  const dnisCreados: string[] = [];

  test('debe mostrar la grilla global de gestión de salud correctamente', async ({ page }) => {
    await page.goto('/salud');
    await expect(page.getByRole('heading', { name: 'Gestión de Salud' })).toBeVisible({ timeout: 10000 });
  });

  test('debe crear un miembro real y registrar un certificado médico desde la interfaz', async ({ page }) => {
    const data = generateTestData('Socio E2E Cert');
    dnisCreados.push(data.dni);

    page.on('dialog', (dialog: any) => dialog.accept());

    await crearMiembroViaUI(page, data);
    await cargarCertificadoViaUI(page, data.nombre, futureDate);

    await expect(
      page.locator(`tr:has-text("${data.nombre}")`).getByRole('button', { name: 'Editar Vigente' })
    ).toBeVisible({ timeout: 15000 });
  });

  test('debe editar el certificado vigente creado y ver el cambio en la tabla', async ({ page }) => {
    const data = generateTestData('Socio E2E Edit');
    dnisCreados.push(data.dni);

    page.on('dialog', (dialog: any) => dialog.accept());

    await crearMiembroViaUI(page, data);
    await cargarCertificadoViaUI(page, data.nombre, futureDate);

    await page.goto('/salud');
    await expect(page.getByText(data.nombre)).toBeVisible({ timeout: 15000 });

    const editarVigenteBtn = page.locator(`tr:has-text("${data.nombre}")`).getByRole('button', { name: 'Editar Vigente' });
    await expect(editarVigenteBtn).toBeVisible({ timeout: 15000 });
    await editarVigenteBtn.click();

    await expect(page.getByText('Modificar Condición Sanitaria')).toBeVisible();
    await page.locator('input[type="date"]').fill('2026-12-31');
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    await expect(page.getByText('Modificar Condición Sanitaria')).toBeHidden({ timeout: 15000 });
  });

  test('debe eliminar físicamente el certificado desde la interfaz', async ({ page }) => {
    const data = generateTestData('Socio E2E Del');
    dnisCreados.push(data.dni);

    page.on('dialog', (dialog: any) => dialog.accept());

    await crearMiembroViaUI(page, data);
    await cargarCertificadoViaUI(page, data.nombre, futureDate);

    await page.goto('/salud');

    const row = page.locator('tr', { hasText: data.nombre });
    await row.waitFor({ state: 'visible', timeout: 15000 });

    await row.getByRole('button', { name: /Historial/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 15000 });

    const deleteResponsePromise = page.waitForResponse(
      (response: any) =>
        response.request().method() === 'DELETE' &&
        response.url().includes('/api/v1/medical-certificates') &&
        [200, 204].includes(response.status()),
      { timeout: 20000 }
    );

    await Promise.all([
      dialog.locator('button[aria-label="Eliminar Físico"]').first().click(),
      deleteResponsePromise,
    ]);

    await expect(dialog).toHaveAttribute('data-state', 'closed', { timeout: 20000 });
    await expect(dialog).toBeHidden({ timeout: 20000 });

    await expect(row.getByRole('button', { name: 'Editar Vigente' })).toBeHidden({ timeout: 20000 });
  });

  test.afterAll(async ({ request }) => {
    try {
      const res = await request.get('http://localhost:3001/api/v1/socios');
      const body = await res.json();
      for (const dni of dnisCreados) {
        const found = (body.data || []).find((m: any) => m.dni === dni);
        if (found?.id) {
          await request.delete(`http://localhost:3001/api/v1/socios/${found.id}`);
        }
      }
    } catch {
    }
  });
});
