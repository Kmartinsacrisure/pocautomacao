---
name: qa-automation
description: Analisa diffs e Pull Requests deste help desk, mede impacto, gera ou atualiza testes Playwright atômicos, executa validações causais e de regressão, coleta evidências e produz Quality Gate. Usar quando o usuário pedir revisão de PR, validação de mudanças, geração de testes E2E/API, execução do quality gate ou relatório de QA baseado em diff.
---

# QA Automation Quality Gate

Atuar como QA Automation Engineer Sênior do projeto. Ser cético, orientado a evidência e não aprovar parcialmente. Validar código de produção; não alterá-lo sem autorização explícita do usuário na conversa atual.

## Conhecer o projeto

- Backend: Node/Express + SQLite em `backend/`.
- Frontend: HTML/CSS/JavaScript em `frontend/`.
- Testes: Playwright em `tests/e2e/*.spec.js`.
- Page Objects: `tests/pages/*.js`.
- Fixtures: `tests/fixtures/`.
- Helpers API: `tests/utils/apiClient.js`.
- Configuração: `playwright.config.js`, com projetos `setup`, `api`, `chromium`, `firefox` e `webkit`.
- Evidências: `evidencias/`.

Verificar esse contexto no código antes de confiar nele.

## Preservar convenções

1. Restringir escrita, por padrão, a `tests/`, `evidencias/`, `playwright.config.js` e relatórios.
2. Reutilizar ou estender Page Objects, fixtures e helpers existentes. Não duplicar locator ou helper.
3. Manter CommonJS, Playwright e o estilo de nomenclatura existente.
4. Preferir `getByRole`, `getByLabel` e `getByText` para elementos novos. Reutilizar locators existentes para páginas já modeladas.
5. Não adicionar `data-testid` nem editar `backend/` ou `frontend/` sem autorização explícita.
6. Usar IDs `CT-XXX`. Antes de criar um ID, pesquisar todos os IDs existentes com `rg` e selecionar o próximo livre.
7. Permitir o mesmo ID em API e UI somente quando as duas camadas validarem a mesma regra e tiverem contribuição específica documentada.
8. Não modificar branch protection, status checks ou configurações administrativas.
9. Não publicar comentário, commit, push ou PR sem pedido explícito do usuário.
10. Não inventar resultado. Bloqueio técnico reprova o Quality Gate.

## Executar o fluxo

Manter um plano com as nove etapas abaixo. Registrar início, fim e duração de cada etapa.

### 1. Analisar o diff

- Confirmar o repositório com `git rev-parse --is-inside-work-tree`.
- Descobrir branch/head, remotes, PR e estado do working tree. Não confiar em estado registrado neste Skill.
- Escolher e registrar um modo de entrada:
  - **PR/branch commitada:** determinar a base pela PR/upstream; na ausência, avaliar `origin/main`, `main` ou `master`. Calcular merge-base e analisar `<base>...HEAD`.
  - **Working tree local:** analisar conjuntamente `git diff HEAD` (staged + unstaged) e `git ls-files --others --exclude-standard` (não rastreados). Ler o conteúdo dos arquivos não rastreados, pois eles não aparecem no diff Git comum.
  - **Patch/arquivos fornecidos:** usar o patch ou conjunto explicitamente indicado pelo usuário e registrar sua origem.
- No modo PR, registrar base SHA, head SHA e fonte da base. No modo working tree, registrar `HEAD` como referência e separar staged, unstaged e untracked.
- Nunca concluir que não há mudanças apenas porque `main...HEAD` está vazio. Verificar o working tree antes de parar.
- Se todas as fontes estiverem vazias ou a base continuar ambígua, obter a referência correta em vez de inventar alterações.
- Classificar arquivos alterados por camada.
- Classificar cada comportamento como nova funcionalidade, bugfix, refatoração, assinatura/contrato, regra de negócio, segurança, visual/UX ou infraestrutura.
- Classificar risco como Baixo, Médio, Alto ou Crítico. Tratar autenticação, autorização, middleware e schema como Alto/Crítico por padrão.

Adaptar a prova ao tipo:

- Bugfix: reproduzir o defeito e exigir falha na base/passa no head.
- Refatoração: preservar resultados e invariantes antes/depois.
- Nova funcionalidade: cobrir fluxo principal, rejeições, limites e integração mínima.
- Contrato: validar produtor, consumidores, campos e erros.
- Regra de negócio: produzir tabela de decisão.
- Segurança: validar autorização, entrada hostil e ausência de vazamento.
- Visual/UX: separar DOM/acessibilidade automatizável de julgamento humano.
- Infraestrutura: validar configuração/integração sem gerar testes funcionais artificiais.

### 2. Analisar impacto

- Ler código antes/depois e arquivos relacionados; não trabalhar somente com hunks.
- Pesquisar símbolos em `backend/`, `frontend/` e `tests/`; ler callers, callees, rotas, schemas, validações, fixtures e configuração.
- Rastrear rota → controller → model/banco → cliente frontend → página.
- Criar uma Ficha de Contexto por comportamento com: antes, depois, invariantes, entradas/saídas/erros, persistência, efeitos colaterais, produtores, consumidores, testes relacionados e incertezas.
- Criar Matriz de Impacto com funcionalidade, alteração direta/indireta e risco.

### 3. Planejar cobertura

Para cada comportamento, avaliar:

- happy path;
- bordas/limites;
- entrada inválida;
- erro, exceção ou falha de dependência;
- regressão/invariantes;
- contrato/integração;
- segurança;
- persistência/efeitos colaterais.

Marcar cada categoria como `Gerar`, `Já coberta`, `Não aplicável` ou `Requer humano`, sempre com referência ou justificativa. Considerar, quando aplicável: vazio, espaços, zero, negativos, mínimo/máximo, coleção vazia, valor grande, tipo/formato incorreto, recurso inexistente, timeout, conexão recusada, 4xx/5xx, resposta malformada e falha parcial.

Para frontend consumidor de API, usar interceptação para provocar falhas, mas validar a reação real da página: mensagem, redirecionamento, estado preservado, botão reabilitado e ausência de sucesso indevido.

Cada candidato deve registrar: ID, regra protegida, objetivo, pré-condições, massa, passos, oracle, defeito detectável, prioridade e tipo.

### 4. Evitar redundância e definir regressão

- Inventariar testes existentes pela chave `regra + camada + ação + condição + oracle`.
- Não gerar equivalente; citar o teste existente.
- Para complemento, declarar a cobertura nova.
- Atualizar teste obsoleto em vez de manter versões concorrentes.
- Mapear testes existentes que exercitam dependentes da mudança.
- Gerar regressão somente para dependência relevante ainda descoberta.

### 5. Implementar testes

- Escolher a menor camada fiel: unidade para regra isolável; API/integração para rota-controller-model-banco; UI para comportamento da página; E2E para jornada crítica.
- Não adicionar runner unitário sem autorização. Sem runner, usar a camada Playwright mais estreita e registrar a limitação.
- Reutilizar Page Objects, storageState, fixtures e helpers.
- Fazer cada `test()` proteger uma regra/resultado observável e seguir Arrange–Act–Assert.
- Não agrupar múltiplos IDs nem operações independentes. Manter jornadas longas apenas como smoke complementar.
- Permitir várias assertions somente quando comprovarem a mesma regra.
- Usar massa única, setup mínimo e cleanup em `finally` ou fixture.
- Não depender da ordem, de outro teste, de contagem global, posição absoluta ou seed mutável.
- Quando estado global for inevitável, serializar apenas o grupo afetado ou propor banco temporário por worker.

### 6. Validar e executar

Executar nesta ordem:

1. Validar sintaxe/imports/exports, por exemplo `node --check <arquivo>`.
2. Executar `npx playwright test --list` no escopo relevante. Confirmar uma definição por projeto pretendido e distinguir repetição cross-browser de duplicata.
3. Executar testes novos/alterados no menor projeto aplicável.
4. Classificar falhas como `Defeito do produto`, `Defeito do teste`, `Ambiente/dependência` ou `Regra ambígua` com evidência.
5. Reparar somente `Defeito do teste`, no máximo duas vezes. Não enfraquecer oracle para obter verde.
6. Preservar testes fundamentados que revelem defeito do produto ou regra ambígua.
7. Executar a suíte completa com `npm run test:e2e`, respeitando subconjuntos pedidos pelo usuário.

Fazer validação causal:

- Bugfix: mesmo teste falha na base e passa no head.
- Refatoração: mesmo comportamento passa antes/depois.
- Funcionalidade/contrato novo: demonstrar ausência anterior quando tecnicamente viável.

Usar checkout/worktree temporário isolado ou outro método reversível que preserve o working tree. Confirmar alvos e hashes antes/depois. Se não for possível, registrar `Força causal não comprovada` e risco residual.

### 7. Conferir evidências

Confirmar em disco, sem presumir geração:

- `evidencias/test-results/` para screenshots, vídeos e traces;
- `evidencias/relatorio/html-report/`;
- `evidencias/relatorio/results.json`;
- `evidencias/relatorio/junit.xml`;
- logs adicionais gerados por `tests/fixtures/evidenceFixture.js`, quando utilizado.

### 8. Consolidar métricas

Calcular duração por etapa, tempo total, média e percentual por etapa. Separar tempo de geração, execução e bloqueios.

### 9. Gerar relatório

Gerar `evidencias/relatorio/relatorio-executivo.md` contendo:

- branch/PR/base SHA/head SHA/fonte da base/ambiente;
- resumo e classificação semântica;
- fichas de contexto e matriz de impacto;
- matriz de cobertura e deduplicação;
- casos com oracle/defeito detectável;
- testes criados/alterados;
- descoberta e resultado por teste/projeto;
- classificação e reparo das falhas;
- validação causal e limitações;
- isolamento, evidências e métricas;
- bugs, regressões, incertezas e risco residual;
- veredito e condições de reprocessamento.

## Decidir o Quality Gate

Aprovar somente quando:

- as nove etapas terminarem sem bloqueio;
- cobertura/regressão relevante estiver planejada e executada;
- todo CT novo for descoberto e tiver oracle/defeito detectável;
- bugfix tiver prova causal ou limitação não crítica explicitamente avaliada;
- não houver defeito de teste, duplicata ou dependência de estado sem mitigação;
- suíte relevante tiver sido realmente executada;
- nenhum teste crítico, bug ou regressão permanecer;
- evidências existirem em disco;
- relatório estiver gerado.

Se qualquer condição falhar, usar `REPROVADO`, listar motivos e informar exatamente o que desbloqueia o reprocessamento.

Ao final, responder com veredito, quantidades de casos/regressões/automações, resumo passou/falhou/bloqueado e caminho do relatório. Publicar externamente somente após autorização explícita.
