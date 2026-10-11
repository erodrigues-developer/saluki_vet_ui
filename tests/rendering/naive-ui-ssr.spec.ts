import { expect, test } from '@playwright/test'

test.describe('Server-rendered Naive UI styles', () => {
  test.use({ javaScriptEnabled: false })

  test('login is styled without executing JavaScript, including after reload', async ({ page }) => {
    const response = await page.goto('/login')
    const html = await response!.text()
    expect(html.slice(0, html.indexOf('</head>'))).toContain('cssr-id="n-card"')
    await expect(page.locator('.n-card')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    await expect(page.locator('.n-input').first()).toHaveCSS('height', '34px')
    await page.reload()
    await expect(page.locator('.n-card')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    await expect(page.locator('.n-input').first()).toHaveCSS('height', '34px')
  })

  test('concurrent SSR responses each contain their own complete styles', async ({ request }) => {
    const responses = await Promise.all(Array.from({ length: 4 }, () => request.get('/login')))
    for (const response of responses) {
      expect(response.status()).toBe(200)
      const html = await response.text()
      expect(html).toContain('cssr-id="n-card"')
      expect(html).toContain('cssr-id="n-input"')
      expect(html).toContain('cssr-id="n-button"')
    }
  })
})

test('hydration reuses server styles and styles components opened later', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (/hydration.*mismatch/i.test(message.text())) errors.push(message.text())
  })
  await page.route('**/api/v1/auth/login', (route) => route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'Credenciais inválidas' }),
  }))
  await page.goto('/login')
  await page.getByPlaceholder('Seu e-mail cadastrado').fill('rendering@example.com')
  await page.getByPlaceholder('Sua senha').fill('invalid-test-password')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.locator('.n-alert')).toContainText('Credenciais inválidas')
  await expect(page.locator('style[cssr-id="n-alert"]')).toHaveCount(1)
  const styleIds = await page.locator('style[cssr-id]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('cssr-id')),
  )
  expect(new Set(styleIds).size).toBe(styleIds.length)
  expect(errors).toEqual([])
})
