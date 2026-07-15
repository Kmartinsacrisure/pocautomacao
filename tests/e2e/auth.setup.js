const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');

const authFile = 'tests/.auth/admin.json';

test('Setup - autentica usuario admin e salva storageState', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.login(
    process.env.E2E_USER_EMAIL || 'admin@empresa.com',
    process.env.E2E_USER_PASSWORD || '123456'
  );

  await expect(page).toHaveURL(/dashboard\.html/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.context().storageState({ path: authFile });
});

