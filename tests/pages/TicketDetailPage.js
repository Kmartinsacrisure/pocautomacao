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
    await this.statusSelect.selectOption(status);
    await this.prioritySelect.selectOption(priority);
    await this.saveChanges.click();
    await expect(this.page.getByText('Chamado atualizado com sucesso!')).toBeVisible();
  }

  async addComment(text) {
    await this.comment.fill(text);
    await this.addCommentButton.click();
    await expect(this.content.getByText(text)).toBeVisible();
  }

  async expectComment(text) {
    await expect(this.content.getByText(text)).toBeVisible();
  }

  async expectHistory(textOrRegex) {
    await expect(this.content.getByText(textOrRegex).first()).toBeVisible();
  }

  async deleteTicket() {
    this.page.once('dialog', dialog => dialog.accept());
    await this.deleteButton.click();
  }

  slug(text) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
  }
}

module.exports = { TicketDetailPage };
