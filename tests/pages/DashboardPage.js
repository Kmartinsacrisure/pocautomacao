const { expect } = require('@playwright/test');

class DashboardPage {
  constructor(page) {
    this.page = page;
    this.content = page.locator('#conteudo-dashboard');
  }

  async goto() {
    await this.page.goto('/pages/dashboard.html');
  }

  async expectLoaded() {
    await expect(this.page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(this.content.getByText('Total de Chamados')).toBeVisible();
    await expect(this.content.getByText('Chamados por Status')).toBeVisible();
  }

  async metricValue(label) {
    const card = this.page.locator('.stat-card').filter({ hasText: label }).first();
    await expect(card).toBeVisible();
    const raw = await card.locator('.value').innerText();
    return Number(raw.trim());
  }

  async expectChartValue(chartTitle, label, value) {
    const chart = this.page.locator('.chart-card').filter({ hasText: chartTitle });
    const row = chart.locator('.bar-row').filter({ hasText: label });
    await expect(row.locator('.bar-label')).toHaveText(label);
    await expect(row.locator('.bar-value')).toHaveText(String(value));
  }
}

module.exports = { DashboardPage };
