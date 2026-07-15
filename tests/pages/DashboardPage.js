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
}

module.exports = { DashboardPage };
