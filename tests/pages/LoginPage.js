const { expect } = require('@playwright/test');

class LoginPage {
  constructor(page) {
    this.page = page;
    this.email = page.locator('#email');
    this.password = page.locator('#senha');
    this.submit = page.locator('#btn-entrar');
  }

  async goto() {
    await this.page.goto('/pages/login.html');
  }

  async login(email = 'admin@empresa.com', password = '123456') {
    await this.goto();
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }

  async expectLoginVisible() {
    await expect(this.page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
    await expect(this.submit).toBeVisible();
  }

  async expectPasswordError(message) {
    await expect(this.page.locator('#erro-senha')).toContainText(message);
  }
}

module.exports = { LoginPage };
