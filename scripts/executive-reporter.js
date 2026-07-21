const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const reportDir = path.join(projectRoot, 'evidencias', 'relatorio');
const executiveReportPath = path.join(reportDir, 'relatorio-executivo.md');
const unifiedReportGenerator = path.join(__dirname, 'generate-unified-report.js');

function gitValue(args, fallback = 'indisponível') {
  try {
    return execFileSync('git', args, {
      cwd: projectRoot,
      encoding: 'utf8',
      windowsHide: true
    }).trim() || fallback;
  } catch {
    return fallback;
  }
}

function markdownCell(value) {
  return String(value ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\|');
}

function countArtifacts(directory) {
  const counts = { '.zip': 0, '.png': 0, '.webm': 0, '.md': 0 };
  if (!fs.existsSync(directory)) return counts;

  const pending = [directory];
  while (pending.length) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(entryPath);
      } else {
        const extension = path.extname(entry.name).toLowerCase();
        if (Object.hasOwn(counts, extension)) counts[extension] += 1;
      }
    }
  }
  return counts;
}

function projectName(test) {
  return test.parent && test.parent.project()
    ? test.parent.project().name
    : 'sem-projeto';
}

class ExecutiveReporter {
  onBegin(config, suite) {
    this.config = config;
    this.suite = suite;
    this.isListMode = process.argv.includes('--list');
  }

  onEnd(result) {
    this.result = result;
    if (this.isListMode) return;

    try {
      this.writeExecutiveReport();
    } catch (error) {
      console.error('Falha ao gerar o relatório executivo:', error);
      return { status: 'failed' };
    }
  }

  async onExit() {
    if (this.isListMode || !this.result) return;

    try {
      delete require.cache[require.resolve(unifiedReportGenerator)];
      require(unifiedReportGenerator);
    } catch (error) {
      console.error('Falha ao gerar o relatório unificado:', error);
    }
  }

  printsToStdio() {
    return false;
  }

  writeExecutiveReport() {
    const tests = this.suite.allTests();
    const projects = new Map();
    const failures = [];
    const caseIds = new Set();
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let flaky = 0;

    for (const test of tests) {
      const project = projectName(test);
      const outcome = test.outcome();
      const finalResult = test.results.at(-1);
      const current = projects.get(project) || {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        flaky: 0,
        duration: 0
      };

      current.total += 1;
      current.duration += test.results.reduce((total, item) => total + (item.duration || 0), 0);

      if (outcome === 'expected') {
        current.passed += 1;
        passed += 1;
      } else if (outcome === 'skipped') {
        current.skipped += 1;
        skipped += 1;
      } else if (outcome === 'flaky') {
        current.flaky += 1;
        flaky += 1;
      } else {
        current.failed += 1;
        failed += 1;
        failures.push({
          project,
          title: test.title,
          status: finalResult ? finalResult.status : outcome,
          error: finalResult && finalResult.error
            ? finalResult.error.message || finalResult.error.value || 'Erro sem mensagem'
            : 'Erro sem mensagem'
        });
      }

      const match = test.title.match(/\bCT-(\d{3})\b/);
      if (match) caseIds.add(match[0]);
      projects.set(project, current);
    }

    const isFullSuite = process.env.npm_lifecycle_event === 'test:e2e';
    const approved = isFullSuite &&
      this.result.status === 'passed' &&
      failed === 0 &&
      skipped === 0 &&
      flaky === 0;
    const verdict = approved ? 'APROVADO' : 'REPROVADO';
    const startTime = this.result.startTime;
    const endTime = new Date(startTime.getTime() + this.result.duration);
    const branch = gitValue(['branch', '--show-current']);
    const head = gitValue(['rev-parse', 'HEAD']);
    const workingTree = gitValue(['status', '--short'], 'limpo');
    const workingTreeLines = workingTree === 'limpo'
      ? ['- limpo']
      : workingTree.split(/\r?\n/).map(line => '- ' + line);
    const artifacts = countArtifacts(path.join(projectRoot, 'evidencias', 'test-results'));
    const projectRows = Array.from(projects.entries())
      .map(([name, values]) => '| ' + [
        markdownCell(name),
        values.total,
        values.passed,
        values.failed,
        values.skipped,
        values.flaky,
        (values.duration / 1000).toFixed(3) + ' s'
      ].join(' | ') + ' |');
    const failureRows = failures.length
      ? failures.map(item => '| ' + [
        markdownCell(item.project),
        markdownCell(item.title),
        markdownCell(item.status),
        markdownCell(item.error)
      ].join(' | ') + ' |')
      : ['Nenhuma falha registrada.'];

    const report = [
      '# Relatório Executivo — Última execução E2E',
      '',
      '## Veredito',
      '',
      '**' + verdict + '**',
      '',
      approved
        ? 'A suíte completa terminou sem falhas, bloqueios, skips ou resultados flaky.'
        : 'A execução não atende todas as condições do Quality Gate. Consulte o escopo e as falhas abaixo.',
      '',
      '## Identificação da execução',
      '',
      '| Campo | Valor |',
      '|---|---|',
      '| Início | ' + startTime.toISOString() + ' |',
      '| Fim | ' + endTime.toISOString() + ' |',
      '| Duração | ' + (this.result.duration / 1000).toFixed(3) + ' s |',
      '| Status Playwright | ' + markdownCell(this.result.status) + ' |',
      '| Escopo | ' + (isFullSuite ? 'Suíte completa via npm run test:e2e' : 'Execução parcial ou ad-hoc') + ' |',
      '| Branch | ' + markdownCell(branch) + ' |',
      '| HEAD | ' + markdownCell(head) + ' |',
      '| Node | ' + markdownCell(process.version) + ' |',
      '',
      '## Resumo',
      '',
      '| Métrica | Quantidade |',
      '|---|---:|',
      '| Execuções | ' + tests.length + ' |',
      '| Aprovadas | ' + passed + ' |',
      '| Falhas | ' + failed + ' |',
      '| Skipped | ' + skipped + ' |',
      '| Flaky | ' + flaky + ' |',
      '| IDs de caso únicos | ' + caseIds.size + ' |',
      '',
      '## Resultado por projeto',
      '',
      '| Projeto | Total | Passou | Falhou | Skipped | Flaky | Duração acumulada |',
      '|---|---:|---:|---:|---:|---:|---:|',
      ...projectRows,
      '',
      'As durações por projeto são acumuladas e podem exceder o tempo total devido ao paralelismo.',
      '',
      '## Falhas',
      '',
      ...(failures.length
        ? [
          '| Projeto | Teste | Status | Erro |',
          '|---|---|---|---|',
          ...failureRows
        ]
        : failureRows),
      '',
      '## Evidências',
      '',
      '| Evidência | Quantidade/caminho |',
      '|---|---|',
      '| Traces | ' + artifacts['.zip'] + ' arquivos ZIP |',
      '| Screenshots | ' + artifacts['.png'] + ' arquivos PNG |',
      '| Vídeos | ' + artifacts['.webm'] + ' arquivos WebM |',
      '| Contextos Markdown | ' + artifacts['.md'] + ' arquivos |',
      '| HTML Playwright | evidencias/relatorio/html-report/index.html |',
      '| JSON | evidencias/relatorio/results.json |',
      '| JUnit | evidencias/relatorio/junit.xml |',
      '',
      '## Working tree no momento do relatório',
      '',
      ...workingTreeLines,
      '',
      '## Critérios automáticos do gate',
      '',
      '- Suíte completa executada pelo comando padrão: ' + (isFullSuite ? 'atendido' : 'não atendido') + '.',
      '- Status final do Playwright igual a passed: ' + (this.result.status === 'passed' ? 'atendido' : 'não atendido') + '.',
      '- Zero falhas: ' + (failed === 0 ? 'atendido' : 'não atendido') + '.',
      '- Zero skipped: ' + (skipped === 0 ? 'atendido' : 'não atendido') + '.',
      '- Zero flaky: ' + (flaky === 0 ? 'atendido' : 'não atendido') + '.',
      '',
      '**QUALITY GATE: ' + verdict + '**',
      '',
      '_Relatório atualizado automaticamente pelo reporter do Playwright._',
      ''
    ].join('\n');

    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(executiveReportPath, report, 'utf8');
  }
}

module.exports = ExecutiveReporter;
