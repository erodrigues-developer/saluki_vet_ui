import { test, expect, type Page } from '@playwright/test'

const seedAuthenticatedSession = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('auth_token', 'test-token')
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 1,
        name: 'Admin',
        email: 'admin@saluki.local',
        roles: [{ code: 'ADMIN' }]
      })
    )
  })
}

test.describe('Commissions and procedures', () => {
  test('should render commissions wallet summary and list rows', async ({ page }) => {
    await seedAuthenticatedSession(page)

    await page.route('**/api/v1/users**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ id: 9, name: 'Dra. Julia' }],
          meta: { total: 1 }
        })
      })
    })

    await page.route('**/api/v1/commissions/summary**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pendingTotal: 42.35,
          paidTotal: 17.8,
          countByStatus: {
            PENDING: 2,
            PAID: 1
          }
        })
      })
    })

    await page.route('**/api/v1/commissions**', async (route) => {
      if (route.request().url().includes('/summary')) {
        await route.fallback()
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 1,
              status: 'PENDING',
              amount: 22.58,
              baseAmount: 150.5,
              ratePercent: 15,
              calculatedAt: '2026-03-02T18:30:00.000Z',
              saleId: 10,
              procedure: { name: 'Consulta Clínica' },
              user: { name: 'Dra. Julia' }
            }
          ],
          meta: { total: 1 }
        })
      })
    })

    await page.goto('/financeiro/comissoes')

    await expect(page.getByText('Carteira de Comissões')).toBeVisible()
    await expect(page.locator('.card-value').first()).toContainText('42,35')
    await expect(page.getByRole('cell', { name: 'Consulta Clínica' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Venda #10' })).toBeVisible()
  })

  test('should submit procedure commissionPercent in procedure form', async ({ page }) => {
    await seedAuthenticatedSession(page)

    let lastProcedurePayload: any = null

    await page.route('**/api/v1/procedures**', async (route) => {
      const method = route.request().method()

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            meta: { total: 0 }
          })
        })
        return
      }

      if (method === 'POST') {
        lastProcedurePayload = route.request().postDataJSON()
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            ...lastProcedurePayload
          })
        })
        return
      }

      await route.fallback()
    })

    await page.goto('/cadastros/procedimentos')
    await page.getByRole('button', { name: 'Novo Procedimento' }).click()
    await page.getByPlaceholder('Ex: Consulta Especialista, Castração...').fill('Consulta Neurológica')
    await page.getByPlaceholder('Ex: 150.00').fill('180')
    await page.getByPlaceholder('Ex: 15.00').fill('12')
    await page.getByRole('button', { name: 'Criar procedimento' }).click()

    await expect.poll(() => lastProcedurePayload).not.toBeNull()
    expect(lastProcedurePayload).toMatchObject({
      name: 'Consulta Neurológica',
      defaultPrice: 180,
      commissionPercent: 12
    })
  })
})
