const { test, expect } = require('@playwright/test');
const { DashboardPage } = require('../pages/DashboardPage');

test('CT-016 - dashboard carrega cards usando a API real', async ({ page }) => {
  const dashboard = new DashboardPage(page);

  await dashboard.goto();

  await dashboard.expectLoaded();
  expect(await dashboard.metricValue('Total de Chamados')).toBeGreaterThanOrEqual(0);
  expect(await dashboard.metricValue('Abertos')).toBeGreaterThanOrEqual(0);
  expect(await dashboard.metricValue('Em Atendimento')).toBeGreaterThanOrEqual(0);
  expect(await dashboard.metricValue('Finalizados')).toBeGreaterThanOrEqual(0);
});

test('CT-017 - dashboard renderiza metricas e agrupamentos retornados pela API', async ({ page }) => {
  const dashboard = new DashboardPage(page);
  await page.route('**/api/dashboard', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      sucesso: true,
      total: 7,
      abertos: 3,
      emAtendimento: 2,
      finalizados: 2,
      porStatus: [
        { status: 'Aberto', total: 3 },
        { status: 'Em Atendimento', total: 2 },
        { status: 'Finalizado', total: 2 }
      ],
      porCategoria: [{ categoria: 'Sistema', total: 4 }],
      porPrioridade: [{ prioridade: 'Alta', total: 5 }]
    })
  }));

  await dashboard.goto();

  expect(await dashboard.metricValue('Total de Chamados')).toBe(7);
  expect(await dashboard.metricValue('Abertos')).toBe(3);
  expect(await dashboard.metricValue('Em Atendimento')).toBe(2);
  expect(await dashboard.metricValue('Finalizados')).toBe(2);
  await dashboard.expectChartValue('Chamados por Status', 'Aberto', 3);
  await dashboard.expectChartValue('Chamados por Categoria', 'Sistema', 4);
  await dashboard.expectChartValue('Chamados por Prioridade', 'Alta', 5);
});

