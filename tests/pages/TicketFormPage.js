const { expect } = require('@playwright/test');

class TicketFormPage {
  constructor(page) {
    this.page = page;
    this.title = page.locator('#titulo');
    this.description = page.locator('#descricao');
    this.category = page.locator('#categoria');
    this.priority = page.locator('#prioridade');
    this.requester = page.locator('#solicitante');
    this.status = page.locator('#status');
    this.submit = page.locator('#btn-salvar');
  }

  async gotoNew() {
    await this.page.goto('/pages/ticket-form.html');
    await expect(this.page.getByRole('heading', { name: 'Abrir novo chamado' })).toBeVisible();
  }

  async gotoEdit(id) {
    await this.page.goto(`/pages/ticket-form.html?id=${id}`);
    await expect(this.page.getByRole('heading', { name: new RegExp(`Editar chamado #0*${id}`) })).toBeVisible();
  }

  async fill(data) {
    if (data.titulo !== undefined) await this.title.fill(data.titulo);
    if (data.descricao !== undefined) await this.description.fill(data.descricao);
    if (data.categoria !== undefined) await this.category.selectOption(data.categoria);
    if (data.prioridade !== undefined) await this.priority.selectOption(data.prioridade);
    if (data.solicitante !== undefined) await this.requester.fill(data.solicitante);
    if (data.status !== undefined) await this.status.selectOption(data.status);
  }

  async submitForm() {
    await this.submit.click();
  }

  async create(data) {
    await this.gotoNew();
    await this.fill(data);
    await this.submitForm();
  }

  async expectRequiredErrors() {
    await expect(this.page.locator('#erro-titulo')).toContainText(/obrigat.rio/i);
    await expect(this.page.locator('#erro-descricao')).toContainText(/obrigat.ria/i);
    await expect(this.page.locator('#erro-categoria')).toContainText('categoria');
    await expect(this.page.locator('#erro-prioridade')).toContainText('prioridade');
    await expect(this.page.locator('#erro-solicitante')).toContainText('solicitante');
  }
}

module.exports = { TicketFormPage };
