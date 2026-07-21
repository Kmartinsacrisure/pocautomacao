const { expect } = require('@playwright/test');

class TicketDetailPage {
  constructor(page) {
    this.page = page;
    this.content = page.locator('#conteudo-detalhe');
    this.statusSelect = page.locator('#select-status');
    this.prioritySelect = page.locator('#select-prioridade');
    this.saveChanges = page.locator('#btn-atualizar');
    this.deleteButton = page.locator('#btn-excluir');
    this.comment = page.locator('#novo-comentario');
    this.addCommentButton = page.locator('#btn-comentar');
  }

  async goto(id) {
    await this.page.goto(`/pages/ticket-detail.html?id=${id}`);
  }

  async expectTicket(title) {
    await expect(this.content.getByRole('heading', { name: new RegExp(title) })).toBeVisible();
  }

  async expectStatus(status) {
    await expect(this.content.locator(`.pill-status-${this.slug(status)}`).first()).toContainText(status);
  }

  async expectPriority(priority) {
    await expect(this.content.locator(`.pill-prio-${this.slug(priority)}`).first()).toContainText(priority);
  }

  async updateStatusAndPriority(status, priority) {
    const responsePromise = this.page.waitForResponse(response =>
      response.request().method() === 'PUT' && /\/api\/tickets\/\d+$/.test(response.url())
    );
    await this.statusSelect.selectOption(status);
    await this.prioritySelect.selectOption(priority);
    await this.saveChanges.click();
    return responsePromise;
  }

  async expectUpdateSucceeded() {
    await expect(this.page.getByText('Chamado atualizado com sucesso!')).toBeVisible();
  }

  async addComment(text) {
    const responsePromise = this.page.waitForResponse(response =>
      response.request().method() === 'POST' && /\/api\/tickets\/\d+\/comentarios$/.test(response.url())
    );
    await this.comment.fill(text);
    await this.addCommentButton.click();
    return responsePromise;
  }

  async submitEmptyComment() {
    await this.comment.fill('   ');
    await this.addCommentButton.click();
  }

  async expectCommentRequiredError() {
    await expect(this.page.locator('#erro-comentario')).toContainText(/Escreva algo antes de enviar/i);
  }

  async expectComment(text) {
    await expect(this.content.getByText(text)).toBeVisible();
  }

  async expectHistory(textOrRegex) {
    await expect(this.content.getByText(textOrRegex).first()).toBeVisible();
  }

  async deleteTicket() {
    const responsePromise = this.page.waitForResponse(response =>
      response.request().method() === 'DELETE' && /\/api\/tickets\/\d+$/.test(response.url())
    );
    this.page.once('dialog', dialog => dialog.accept());
    await this.deleteButton.click();
    return responsePromise;
  }

  slug(text) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
  }
}

module.exports = { TicketDetailPage };
