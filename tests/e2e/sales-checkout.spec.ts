import { test, expect, type Page } from '@playwright/test';

const seedAuthenticatedSession = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 1,
        name: 'Admin',
        email: 'admin@saluki.local',
        roles: [{ code: 'ADMIN' }],
      }),
    );
  });
};

test.describe('Vendas checkout flow', () => {
  test('should allow checkout only for OPEN sales and update status locally', async ({
    page,
  }) => {
    await seedAuthenticatedSession(page);

    let salesFetchCount = 0;
    const sales = [
      {
        id: 1,
        saleDate: '2026-03-02T10:00:00.000Z',
        status: 'OPEN',
        totalAmount: 150.5,
        client: { name: 'Tutor 1' },
        veterinarian: { name: 'Vet 1' },
      },
      {
        id: 2,
        saleDate: '2026-03-02T11:00:00.000Z',
        status: 'PAID',
        totalAmount: 89,
        client: { name: 'Tutor 2' },
        veterinarian: { name: 'Vet 2' },
      },
    ];

    await page.route('**/api/v1/sales**', async (route) => {
      const method = route.request().method();
      const url = route.request().url();

      if (method === 'GET' && !url.includes('/checkout')) {
        salesFetchCount += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: sales,
            total: sales.length,
          }),
        });
        return;
      }

      if (method === 'POST' && url.endsWith('/api/v1/sales/1/checkout')) {
        sales[0].status = 'PAID';
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            saleId: 1,
            saleStatus: 'PAID',
            paymentId: 901,
            accountReceivableId: 702,
            paymentMethodId: 1,
            amount: 150.5,
            paidAt: '2026-03-02T18:30:00.000Z',
            dueDate: '2026-03-02',
            description: 'Recebimento da venda #1',
          }),
        });
        return;
      }

      await route.fallback();
    });

    await page.route('**/api/v1/payment-methods**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ id: 1, name: 'PIX', isActive: true }],
          total: 1,
        }),
      });
    });

    await page.goto('/financeiro/vendas');

    await expect(page.locator('[data-testid="checkout-button-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="checkout-button-2"]')).toHaveCount(0);

    await page.locator('[data-testid="checkout-button-1"]').click();
    await page.getByRole('button', { name: 'Confirmar Recebimento' }).click();

    await expect(page.locator('.n-message')).toContainText(
      'Recebimento realizado com sucesso.',
    );
    await expect(
      page.locator('tr', { hasText: 'Tutor 1' }).getByText('Paga'),
    ).toBeVisible();

    await page.waitForTimeout(200);
    expect(salesFetchCount).toBe(1);
  });

  test('should show duplicate business error and keep screen state coherent', async ({
    page,
  }) => {
    await seedAuthenticatedSession(page);

    const sales = [
      {
        id: 1,
        saleDate: '2026-03-02T10:00:00.000Z',
        status: 'OPEN',
        totalAmount: 150.5,
        client: { name: 'Tutor 1' },
        veterinarian: { name: 'Vet 1' },
      },
    ];

    await page.route('**/api/v1/sales**', async (route) => {
      const method = route.request().method();
      const url = route.request().url();

      if (method === 'GET' && !url.includes('/checkout')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: sales,
            total: sales.length,
          }),
        });
        return;
      }

      if (method === 'POST' && url.endsWith('/api/v1/sales/1/checkout')) {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 409,
            message: 'Venda #1 ja foi liquidada.',
          }),
        });
        return;
      }

      await route.fallback();
    });

    await page.route('**/api/v1/payment-methods**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ id: 1, name: 'PIX', isActive: true }],
          total: 1,
        }),
      });
    });

    await page.goto('/financeiro/vendas');
    await page.locator('[data-testid="checkout-button-1"]').click();
    await page.getByRole('button', { name: 'Confirmar Recebimento' }).click();

    await expect(page.locator('.n-message')).toContainText(
      'Venda #1 ja foi liquidada.',
    );
    await expect(
      page.locator('tr', { hasText: 'Tutor 1' }).getByText('Aberta'),
    ).toBeVisible();
  });
});
