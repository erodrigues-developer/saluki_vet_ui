import { test, expect } from '@playwright/test';

const signIn = async (page: any) => {
  const response = await page.request.post('/api/v1/auth/login', {
    headers: { Origin: 'https://localhost:3443', 'X-Sigmavet-Request': '1' },
    data: { email: 'admin@example.test', password: 'Ficticia-2026!' },
  });
  expect(response.status()).toBe(201);
};

test('prescription print opens through SSR and renders fictitious clinical data', async ({ page }) => {
  await signIn(page);
  const fixtures: Record<string, unknown> = {
    '/api/v1/consultations/112': { id: 112, petId: 7, clientId: 8, visitDate: '2026-10-11T12:00:00Z' },
    '/api/v1/prescriptions': { data: [{ id: 9, content: 'Orientação veterinária fictícia para teste.', prescribedAt: '2026-10-11T12:00:00Z', veterinarian: { name: 'Veterinário fictício' } }] },
    '/api/v1/clinic-settings': {},
    '/api/v1/pets/7': { id: 7, name: 'Paciente fictício', species: { name: 'Canina' } },
    '/api/v1/clients/8': { id: 8, name: 'Tutor fictício' },
  };
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!(path in fixtures)) return route.continue();
    if (path === '/api/v1/prescriptions') expect(new URL(route.request().url()).searchParams.get('consultationId')).toBe('112');
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(fixtures[path]) });
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto('/atendimento/consultas/112/prescricao/imprimir');
  expect(response!.status()).toBe(200);
  await expect(page.locator('article.page')).toBeVisible();
  await expect(page.getByText('Paciente fictício', { exact: false })).toBeVisible();
  await expect(page.getByText('Orientação veterinária fictícia para teste.')).toBeVisible();
  await page.evaluate(() => { window.print = () => { document.body.dataset.printRequested = 'true'; }; });
  await page.getByRole('button', { name: 'Imprimir', exact: true }).click();
  expect(await page.locator('body').getAttribute('data-print-requested')).toBe('true');
  expect(errors).toEqual([]);
});

test('forbidden print data redirects without losing Nuxt context in the async fetch hook', async ({ page }) => {
  await signIn(page);
  await page.route('**/api/v1/consultations/112', (route) => route.fulfill({ status: 403, contentType: 'application/json', body: '{"statusCode":403}' }));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/atendimento/consultas/112/prescricao/imprimir');
  await expect(page).toHaveURL('/403');
  expect(errors).toEqual([]);
});
