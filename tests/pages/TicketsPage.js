const { expect } = require('@playwright/test');

class TicketsPage {
  constructor(page) {
    this.page = page;
    this.searchInput = page.locator('#filtro-busca');
    this.statusFilter = page.locator('#filtro-status');
    this.priorityFilter = page.locator('#filtro-prioridade');
    this.sortFilter = page.locator('#filtro-ordenar');
    this.list = page.locator('#lista-chamados');
    this.newTicket = page.getByRole('link', { name: /Novo Chamado/ });
  }

  async goto() {
    await this.page.goto('/pages/tickets.html');
    await expect(this.page.getByRole('heading', { name: 'Chamados' })).toBeVisible();
  }

  async search(term) {
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(450);
  }

  async filterByStatus(status) {
    await this.statusFilter.selectOption(status);
  }

  async filterByPriority(priority) {
    await this.priorityFilter.selectOption(priority);
  }

  async sortBy(value) {
    await this.sortFilter.selectOption(value);
  }

  async openNewTicket() {
    await this.newTicket.click();
  }

  async expectTicketVisible(title) {
    await expect(this.list.getByText(title)).toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.list.getByText('Nenhum chamado encontrado')).toBeVisible();
  }

  async openTicketByTitle(title) {
    await this.list.getByText(title).click();
  }
}

module.exports = { TicketsPage };
