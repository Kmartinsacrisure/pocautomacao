const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');

// Estes testes validam login/logout sem reaproveitar a sessao criada no setup.
test.use({ storageState: { cookies: [], origins: [] } });

test('CT-001 - login com credenciais validas redireciona para dashboard', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.login('admin@empresa.com', '123456');

  await expect(page).toHaveURL(/dashboard\.html/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

test('CT-002 - login com senha invalida exibe erro e permanece na tela de login', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.login('admin@empresa.com', 'senha-incorreta');

  await expect(page).toHaveURL(/login\.html/);
  await loginPage.expectPasswordError(/E-mail ou senha inv.lidos/i);
});

test('CT-003 - pagina protegida sem sessao redireciona para login', async ({ page }) => {
  await page.goto('/pages/tickets.html');

  await expect(page).toHaveURL(/login\.html/);
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
});

