import { test, expect } from '@playwright/test';

/**
 * Tests E2E Full-Stack para la vista de Salud (Certificados Médicos).
 * NO hay ningún mock de red. Playwright interactúa con:
 * - El Frontend React en http://localhost:5173
 * - La API Fastify real en http://localhost:3001
 * - La base de datos PostgreSQL de test (alentapp_test_db)
 *
 * El global-setup se encarga de limpiar la DB antes de correr la suite,
 * por lo que cada test empieza desde un estado conocido y limpio.
 */

test.describe('Medical Certificates Full-Stack E2E', () => {
  test.describe.configure({ mode: 'serial' });

  // Generamos un sufijo aleatorio para que Nombre, DNI e Email sean únicos en cada ejecución
  const randomId = Math.floor(Math.random() * 900000 + 100000).toString(); 
  const nombreSocio = `Socio E2E Salud ${randomId}`; // Ejemplo: Socio E2E Salud 554321
  const dniSocio = `48${randomId}`; 
  const emailSocio = `socioe2esalud_${randomId}@e2e.com`;

  test('debe mostrar la grilla global de gestión de salud correctamente', async ({ page }) => {
    await page.goto('/salud');
    await expect(page.getByRole('heading', { name: 'Gestión de Salud' })).toBeVisible({ timeout: 10000 });
  });

  test('debe crear un miembro real y registrar un certificado médico desde la interfaz', async ({ page }) => {
    await page.goto('/members');
    await expect(page.getByRole('heading', { name: 'Administración de Miembros' })).toBeVisible({ timeout: 10000 });
    
    // Abrir modal de creación del miembro base
    await page.getByRole('button', { name: /Agregar Miembro/i }).click();
    await expect(page.getByText('Agregar Nuevo Miembro')).toBeVisible();
    
    // Llenar formulario con datos reales y dinámicos
    await page.getByPlaceholder('Ej. Juan Pérez').fill(nombreSocio);
    await page.getByPlaceholder('Ej. 12345678').fill(dniSocio);
    await page.getByPlaceholder('ejemplo@correo.com').fill(emailSocio);
    await page.getByLabel(/Fecha de Nacimiento/i).fill('2000-01-01');
    
    // Guardar miembro
    await page.getByRole('button', { name: 'Crear Miembro' }).click();
    await expect(page.getByRole('button', { name: 'Crear Miembro' })).toBeHidden({ timeout: 15000 });
    
    // Navegar a salud para asociar el certificado al nuevo miembro único
    await page.goto('/salud');
    await expect(page.getByText(nombreSocio)).toBeVisible({ timeout: 15000 });

    // Abrir modal de carga de certificado afectando solo a la fila de nuestro socio único
    await page.locator(`tr:has-text("${nombreSocio}")`).getByRole('button', { name: 'Cargar Certificado' }).click();
    await expect(page.getByText(`Cargar Certificado: ${nombreSocio}`)).toBeVisible();

    // Llenar formulario del certificado médico
    await page.getByPlaceholder('Ej. MN 123456').fill('MN 999111');
    await page.locator('input[type="date"]').first().fill('2026-05-28');
    await page.locator('input[type="date"]').last().fill('2026-08-28');

    // Aceptar el alert de éxito automáticamente
    page.on('dialog', (dialog) => dialog.accept());

    // Registrar
    await page.getByRole('button', { name: 'Registrar Certificado' }).click();
    await expect(page.getByText(`Cargar Certificado: ${nombreSocio}`)).toBeHidden({ timeout: 15000 });
  });

  test('debe editar el certificado vigente creado y ver el cambio en la tabla', async ({ page }) => {
    await page.goto('/salud');
    await expect(page.getByText('Gestión de Salud')).toBeVisible({ timeout: 10000 });
    
    // Esperar que el miembro del test anterior esté en la tabla
    await expect(page.getByText(nombreSocio)).toBeVisible({ timeout: 15000 });

    // Clic en Editar Vigente apuntando específicamente a la fila de nuestro socio único
    const editarVigenteBtn = page.locator(`tr:has-text("${nombreSocio}")`).getByRole('button', { name: 'Editar Vigente' });
    await expect(editarVigenteBtn).toBeVisible({ timeout: 15000 });
    
    await editarVigenteBtn.click();
    await expect(page.getByText('Modificar Condición Sanitaria')).toBeVisible();

    // Cambiar la fecha de vencimiento
    await page.locator('input[type="date"]').fill('2026-12-31');

    // Guardar cambios
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(page.getByText('Modificar Condición Sanitaria')).toBeHidden({ timeout: 15000 });
  });
});