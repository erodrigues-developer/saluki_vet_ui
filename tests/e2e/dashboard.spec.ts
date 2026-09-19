import { test, expect } from '@playwright/test';

test('loads the operational dashboard from the consolidated backend endpoint', async ({ page, context, request }) => {
  const loginResponse = await request.post('http://127.0.0.1:3000/api/v1/auth/login', {
    data: { email: 'admin@salukivet.com.br', password: 'admin123' },
  });
  const auth = (await loginResponse.json()).data;
  await context.addCookies([{
    name: 'auth_token',
    value: auth.access_token,
    domain: '127.0.0.1',
    path: '/',
  }]);
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
  }, { token: auth.access_token, user: auth.user });

  const overviewResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/dashboard/overview') && response.status() === 200,
  );
  await page.goto('/');
  await overviewResponse;

  await expect(page.getByRole('heading', { name: 'Visão rápida do dia' })).toBeVisible();
  await expect(page.getByText('Atendimentos hoje')).toBeVisible();
  await expect(page.getByText('Vendas hoje')).toBeVisible();
  await expect(page.getByText('Contas a pagar · mês atual')).toBeVisible();
  await expect(page.getByText('R$ 12.450')).toHaveCount(0);
});
