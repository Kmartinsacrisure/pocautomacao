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

test('CT-027 - login rejeita formulario com credenciais vazias sem chamar a API', async ({ page }) => {
  const loginPage = new LoginPage(page);
  let loginRequests = 0;
  page.on('request', request => {
    if (request.url().endsWith('/api/login')) loginRequests += 1;
  });

  await loginPage.submitEmpty();

  await loginPage.expectRequiredErrors();
  expect(loginRequests).toBe(0);
});

test('CT-028 - login exibe erro do servidor e reabilita o botao', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await page.route('**/api/login', route => route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ sucesso: false, mensagem: 'Falha temporaria no login.' })
  }));

  await loginPage.login('admin@empresa.com', '123456');

  await loginPage.expectPasswordError(/Falha temporaria no login/i);
  await loginPage.expectSubmitEnabled();
  await expect(page).toHaveURL(/login\.html/);
});

