const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const reportDir = path.join(projectRoot, 'evidencias', 'relatorio');
const executiveReportPath = path.join(reportDir, 'relatorio-executivo.md');
const resultsPath = path.join(reportDir, 'results.json');
const playwrightReportPath = path.join(reportDir, 'html-report', 'index.html');
const outputPath = path.join(reportDir, 'index.html');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function formatDuration(milliseconds) {
  if (!Number.isFinite(milliseconds)) return 'N/D';
  return (milliseconds / 1000).toFixed(1) + ' s';
}

fs.mkdirSync(reportDir, { recursive: true });

const executiveMarkdown = fs.existsSync(executiveReportPath)
  ? fs.readFileSync(executiveReportPath, 'utf8')
  : '# Relatório executivo indisponível\n\nExecute o fluxo de QA para gerar relatorio-executivo.md.';
const results = readJson(resultsPath);
const stats = results && results.stats ? results.stats : {};
const verdictMatch = executiveMarkdown.match(/\*\*(APROVADO|REPROVADO)([^*]*)\*\*/i);
const verdict = verdictMatch ? verdictMatch[1].toUpperCase() : 'NÃO INFORMADO';
const verdictClass = verdict === 'APROVADO' ? 'approved' : verdict === 'REPROVADO' ? 'rejected' : 'unknown';
const nativeReportAvailable = fs.existsSync(playwrightReportPath);
const generatedAt = new Date().toLocaleString('pt-BR');
const resultsWarning = !results
  ? 'results.json não está disponível ou não contém JSON válido.'
  : stats.expected === 0 && stats.skipped > 0
    ? 'Os dados consolidados do JSON parecem incompletos. Consulte o relatório executivo e as evidências técnicas.'
    : '';

const cards = [
  ['Esperados', stats.expected ?? 'N/D'],
  ['Falhas', stats.unexpected ?? 'N/D'],
  ['Flaky', stats.flaky ?? 'N/D'],
  ['Ignorados', stats.skipped ?? 'N/D'],
  ['Duração', formatDuration(stats.duration)]
];

const cardsHtml = cards.map(function renderCard(card) {
  return '<div class="card"><span>' + escapeHtml(card[0]) + '</span><strong>' +
    escapeHtml(card[1]) + '</strong></div>';
}).join('');

const nativeReportHtml = nativeReportAvailable
  ? '<p class="notice">O conteúdo abaixo é o relatório HTML nativo do Playwright, preservado sem alterações.</p>' +
    '<iframe src="./html-report/index.html" title="Relatório Playwright"></iframe>'
  : '<p>O relatório HTML do Playwright ainda não existe. Execute npm run test:e2e primeiro.</p>';

const html = [
  '<!DOCTYPE html>',
  '<html lang="pt-BR">',
  '<head>',
  '  <meta charset="UTF-8">',
  '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
  '  <title>Relatório unificado de QA</title>',
  '  <style>',
  '    :root { color-scheme: light; --bg: #f4f6fb; --card: #fff; --text: #182033; --muted: #63708a; --line: #dfe4ee; --accent: #315cdb; --ok: #16794b; --bad: #b42318; --warn: #9a6700; }',
  '    * { box-sizing: border-box; }',
  '    body { margin: 0; background: var(--bg); color: var(--text); font: 14px/1.55 system-ui, sans-serif; }',
  '    header { padding: 24px clamp(18px, 4vw, 56px); background: #11182a; color: #fff; }',
  '    header h1 { margin: 0 0 6px; font-size: clamp(22px, 3vw, 32px); }',
  '    header p { margin: 0; color: #b9c3d8; }',
  '    main { max-width: 1440px; margin: 0 auto; padding: 24px clamp(18px, 4vw, 56px) 48px; }',
  '    .toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 18px; }',
  '    .verdict { padding: 8px 12px; border-radius: 999px; font-weight: 800; letter-spacing: .04em; }',
  '    .approved { color: var(--ok); background: #dff7e9; }',
  '    .rejected { color: var(--bad); background: #fee4e2; }',
  '    .unknown { color: var(--warn); background: #fff1c2; }',
  '    .button { display: inline-block; padding: 9px 13px; border-radius: 7px; background: var(--accent); color: #fff; text-decoration: none; font-weight: 650; }',
  '    .button.secondary { color: var(--text); background: #e8ecf5; }',
  '    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap: 12px; margin-bottom: 18px; }',
  '    .card, .panel { background: var(--card); border: 1px solid var(--line); border-radius: 10px; box-shadow: 0 2px 8px rgba(18, 33, 62, .05); }',
  '    .card { padding: 14px 16px; }',
  '    .card span { display: block; color: var(--muted); font-size: 12px; }',
  '    .card strong { display: block; font-size: 23px; margin-top: 3px; }',
  '    .panel { padding: clamp(18px, 3vw, 32px); margin-bottom: 20px; overflow: hidden; }',
  '    .panel h2 { margin-top: 0; }',
  '    .markdown { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font: 13px/1.6 ui-monospace, SFMono-Regular, Consolas, monospace; }',
  '    iframe { width: 100%; min-height: 780px; border: 1px solid var(--line); border-radius: 8px; background: #fff; }',
  '    .notice { color: var(--muted); margin: 0 0 12px; }',
  '    .warning { padding: 12px 14px; margin-bottom: 18px; border: 1px solid #f2c94c; border-radius: 8px; color: #6f4b00; background: #fff7d6; }',
  '  </style>',
  '</head>',
  '<body>',
  '  <header>',
  '    <h1>Relatório unificado de QA</h1>',
  '    <p>Resumo executivo e evidências técnicas do Playwright · gerado em ' + escapeHtml(generatedAt) + '</p>',
  '  </header>',
  '  <main>',
  '    <div class="toolbar">',
  '      <span class="verdict ' + verdictClass + '">QUALITY GATE: ' + escapeHtml(verdict) + '</span>',
  nativeReportAvailable ? '      <a class="button" href="./html-report/index.html">Abrir Playwright em tela cheia</a>' : '',
  '      <a class="button secondary" href="./relatorio-executivo.md">Abrir Markdown original</a>',
  '      <a class="button secondary" href="./results.json">Abrir JSON</a>',
  '      <a class="button secondary" href="./junit.xml">Abrir JUnit</a>',
  '    </div>',
  resultsWarning ? '    <p class="warning">' + escapeHtml(resultsWarning) + '</p>' : '',
  '    <section class="cards">' + cardsHtml + '</section>',
  '    <article class="panel">',
  '      <h2>Relatório executivo</h2>',
  '      <pre class="markdown">' + escapeHtml(executiveMarkdown) + '</pre>',
  '    </article>',
  '    <section class="panel">',
  '      <h2>Relatório técnico do Playwright</h2>',
  nativeReportHtml,
  '    </section>',
  '  </main>',
  '</body>',
  '</html>'
].join('\n');

fs.writeFileSync(outputPath, html, 'utf8');
console.log('Relatório unificado gerado em: ' + outputPath);
