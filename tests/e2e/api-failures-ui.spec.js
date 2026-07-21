const { test, expect } = require('@playwright/test');
const { DashboardPage } = require('../pages/DashboardPage');

test('CT-029 - dashboard exibe erro retornado pela API', async ({ page }) => {
  await page.route('**/api/dashboard', route => route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ sucesso: false, mensagem: 'Dashboard indisponivel.' })
  }));

  await page.goto('/pages/dashboard.html');

  await expect(page.getByRole('heading', { name: 'Não foi possível carregar o dashboard' })).toBeVisible();
  await expect(page.getByText('Dashboard indisponivel.').first()).toBeVisible();
});

test('CT-030 - dashboard trata resposta JSON malformada sem exibir sucesso', async ({ page }) => {
  await page.route('**/api/dashboard', route => route.fulfill({
    status: 200,
    contentType: 'text/plain',
    body: 'resposta-nao-json'
  }));

  await page.goto('/pages/dashboard.html');

  await expect(page.getByRole('heading', { name: 'Não foi possível carregar o dashboard' })).toBeVisible();
  await expect(page.locator('.stat-card')).toHaveCount(0);
});

test('CT-031 - dashboard redireciona para login quando a sessao expira', async ({ page }) => {
  const dashboard = new DashboardPage(page);
  await page.route('**/api/dashboard', route => route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ sucesso: false, mensagem: 'Sessão expirada.' })
  }));

  await dashboard.goto();

  await expect(page).toHaveURL(/login\.html/);
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
});
