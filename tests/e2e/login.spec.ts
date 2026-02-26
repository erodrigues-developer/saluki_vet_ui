import { test, expect } from '@playwright/test';

test.describe('Login flow', () => {
  test('should log in successfully with valid credentials', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Check we are on the login page
    await expect(page.locator('text=Acesso ao Saluki ERP')).toBeVisible();

    // Fill the credentials
    await page.getByPlaceholder('Seu e-mail cadastrado').fill('admin@salukivet.com.br');
    await page.getByPlaceholder('Sua senha').fill('admin123');

    // Click the login button
    await page.getByRole('button', { name: 'Entrar' }).click();

    // The user should be redirected, likely to /admin
    await page.waitForURL(/\/(admin|clinic)/, { timeout: 30000 });

    // Check for success message
    await expect(page.locator('.n-message')).toHaveText(/Bem vindo/, { timeout: 15000 });
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('Seu e-mail cadastrado').fill('invalid@salukivet.com.br');
    await page.getByPlaceholder('Sua senha').fill('wrongpassword');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Verify error message
    // Note: The UI displays <div class="error-msg"> <n-alert type="error"> {{ error }} </n-alert> </div>
    await expect(page.locator('.n-alert')).toBeVisible({ timeout: 15000 });
  });
});
