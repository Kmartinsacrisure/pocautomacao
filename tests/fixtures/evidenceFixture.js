const base = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const EVIDENCE_ROOT = path.join(process.cwd(), 'evidencias');

function sanitize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function testDirFor(testInfo) {
  const project = sanitize(testInfo.project.name);
  const name = sanitize(testInfo.title);
  return path.join(EVIDENCE_ROOT, 'screenshots', project, name);
}

function writeJson(dir, fileName, data) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), JSON.stringify(data, null, 2));
}

/**
 * Extensao do test base do Playwright que grava evidencias adicionais
 * (screenshots nomeados por etapa, log de rede, log de API e console)
 * na estrutura evidencias/ pedida pelo Quality Gate de QA.
 * Trace, video e screenshot final ja sao gerados pelo playwright.config.js.
 */
const test = base.test.extend({
  evidence: async ({ page }, use, testInfo) => {
    let step = 0;
    const network = [];
    const api = [];
    const consoleLogs = [];
    const timings = new Map();

    const onRequest = (request) => {
      timings.set(request, Date.now());
    };
    const onResponse = async (response) => {
      const request = response.request();
      const startedAt = timings.get(request);
      const entry = {
        method: request.method(),
        url: request.url(),
        status: response.status(),
        durationMs: startedAt ? Date.now() - startedAt : undefined
      };
      network.push(entry);

      if (request.url().includes('/api/')) {
        let requestBody;
        let responseBody;
        try { requestBody = request.postDataJSON(); } catch { requestBody = request.postData() || undefined; }
        try { responseBody = await response.json(); } catch { responseBody = undefined; }
        api.push({ ...entry, requestBody, responseBody });
      }
    };
    const onConsole = (msg) => {
      if (['error', 'warning'].includes(msg.type())) {
        consoleLogs.push({ type: msg.type(), text: msg.text(), location: msg.location() });
      }
    };

    page.on('request', onRequest);
    page.on('response', onResponse);
    page.on('console', onConsole);

    await use({
      async step(label) {
        step += 1;
        const dir = testDirFor(testInfo);
        fs.mkdirSync(dir, { recursive: true });
        const fileName = `${String(step).padStart(2, '0')}-${sanitize(label)}.png`;
        const filePath = path.join(dir, fileName);
        await page.screenshot({ path: filePath, fullPage: true });
        await testInfo.attach(`etapa-${step}-${label}`, { path: filePath, contentType: 'image/png' });
      }
    });

    page.off('request', onRequest);
    page.off('response', onResponse);
    page.off('console', onConsole);

    const project = sanitize(testInfo.project.name);
    const name = sanitize(testInfo.title);

    writeJson(path.join(EVIDENCE_ROOT, 'network', project), `${name}.json`, network);
    if (api.length > 0) {
      writeJson(path.join(EVIDENCE_ROOT, 'api', project), `${name}.json`, api);
    }
    if (consoleLogs.length > 0) {
      writeJson(path.join(EVIDENCE_ROOT, 'logs', project), `${name}-console.json`, consoleLogs);
    }
    writeJson(path.join(EVIDENCE_ROOT, 'logs', project), `${name}-execucao.json`, {
      title: testInfo.title,
      status: testInfo.status,
      durationMs: testInfo.duration,
      retry: testInfo.retry,
      errors: testInfo.errors
    });
  }
});

module.exports = { test, expect: base.expect };
