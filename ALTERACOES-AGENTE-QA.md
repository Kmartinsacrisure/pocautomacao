# Alterações realizadas no agente de QA

## Escopo

Esta rodada alterou o prompt do agente em `.claude/agents/qa-automation.md` e, posteriormente, aplicou as novas regras à suíte E2E existente. Nenhum arquivo de produção ou configuração Playwright foi modificado.

As correções foram executadas na ordem solicitada: primeiro todos os itens de prioridade Alta e, depois da validação desse grupo, todos os itens de prioridade Média.

## Resumo dos arquivos

| Arquivo | Alteração |
|---|---|
| `.claude/agents/qa-automation.md` | Aprimoramento do processo de análise, geração e validação dos testes |
| `tests/e2e/api.spec.js` | Separação dos fluxos API e inclusão de negativos/contratos |
| `tests/e2e/auth.spec.js` | Validações de formulário vazio e falha do servidor |
| `tests/e2e/dashboard-ui.spec.js` | Remoção de contagem global e separação dos CT-016/CT-017 |
| `tests/e2e/tickets-ui.spec.js` | Divisão do megafluxo CT-019 em testes atômicos |
| `tests/e2e/api-failures-ui.spec.js` | Novo spec para 401, 500 e JSON malformado |
| `tests/pages/*.js` | Sincronização das ações e assertions reutilizáveis nos Page Objects |
| `ALTERACOES-AGENTE-QA.md` | Relatório consolidado desta rodada |

## Correções de prioridade Alta

### Correção #1 — Contexto completo da mudança

- **Problema original:** a análise usava principalmente busca textual e podia gerar testes com base apenas nas linhas do diff.
- **Antes:** o prompt mandava procurar o nome do módulo/função e rastrear a cadeia rota → controller → model → frontend.
- **Depois:** o agente deve ler o código antes e depois, callers, callees, contratos, persistência, configurações, fixtures e testes relacionados. Também deve produzir uma `Ficha de Contexto da Mudança` com comportamento anterior, comportamento novo, invariantes, entradas, saídas, erros, efeitos colaterais, produtores, consumidores e incertezas.
- **Resultado:** a geração deixa de depender apenas do hunk alterado e passa a considerar efeitos indiretos.
- **Status:** Resolvido.

### Correção #2 — Estratégia por tipo de mudança

- **Problema original:** havia classificação por tipo de arquivo e risco, mas não por natureza da mudança.
- **Antes:** controller, route, model, middleware, frontend, teste etc.
- **Depois:** cada comportamento deve ser classificado como nova funcionalidade, correção de bug, refatoração, mudança de assinatura/contrato, regra de negócio, segurança, visual/UX ou infraestrutura.
- **Estratégias adicionadas:**
  - bugfix deve reproduzir o defeito e falhar antes/passar depois;
  - refatoração deve preservar invariantes;
  - funcionalidade nova deve cobrir fluxo principal, rejeições, limites e integração;
  - contrato deve validar produtor e consumidores;
  - regra de negócio deve gerar tabela de decisão;
  - segurança deve avaliar autorização, entradas hostis e vazamento;
  - visual/UX deve separar automação de julgamento humano;
  - infraestrutura não deve gerar testes funcionais artificiais.
- **Status:** Resolvido.

### Correção #3 — Matriz obrigatória de cobertura

- **Problema original:** a instrução genérica de gerar casos positivos, negativos e de borda não garantia cobertura suficiente.
- **Antes:** o agente gerava diretamente uma tabela de casos considerados relevantes.
- **Depois:** cada comportamento passa por uma `Matriz de Decisão de Cobertura` com:
  - happy path;
  - bordas e limites;
  - entradas inválidas;
  - erros, exceções e falhas de dependência;
  - regressões e invariantes;
  - contrato e integração;
  - segurança;
  - persistência e efeitos colaterais.
- **Decisões permitidas:** `Gerar`, `Já coberta`, `Não aplicável` ou `Requer humano`, sempre com referência ou justificativa.
- **Status:** Resolvido.

### Correção #4 — Testes atômicos

- **Problema original:** o prompt permitia testes com múltiplos CTs e operações independentes no mesmo fluxo.
- **Antes:** exigia apenas nome no formato `CT-0XX - descrição`.
- **Depois:**
  - cada `test()` deve proteger uma regra ou resultado observável;
  - deve seguir Arrange–Act–Assert ou Given–When–Then;
  - não pode agrupar IDs como `CT-001/CT-002`;
  - não deve combinar criar, atualizar, comentar e excluir como substituto de casos específicos;
  - jornadas longas são permitidas apenas como smoke complementar.
- **Status:** Resolvido parcialmente. A geração futura foi corrigida, mas os megafluxos existentes não foram refatorados nesta rodada.

### Correção #5 — Validação causal e prevenção de falsos positivos

- **Problema original:** executar um teste somente no código novo não comprovava que ele detectava a alteração.
- **Antes:** a tabela informava apenas o resultado esperado.
- **Depois:** cada caso deve declarar:
  - regra protegida;
  - oracle observável;
  - defeito que deve detectar;
  - comportamento que faria o teste falhar.
- **Validação causal adicionada:**
  - bugfix: falha na base e passa no head;
  - refatoração: passa antes e depois;
  - funcionalidade nova/contrato: demonstra ausência da capacidade anterior quando tecnicamente viável.
- A comparação deve usar checkout ou worktree temporário sem sobrescrever alterações do usuário.
- **Status:** Resolvido.

### Correção #6 — Ciclo de validação e reparo

- **Problema original:** testes com sintaxe, import, locator ou lógica quebrada seguiam diretamente para reprovação.
- **Antes:** execução direta da suíte.
- **Depois:** foi adicionado o seguinte funil:
  1. validar sintaxe, imports, exports e CommonJS;
  2. confirmar descoberta com `playwright test --list`;
  3. executar somente testes novos/alterados;
  4. classificar falhas como produto, teste, ambiente/dependência ou regra ambígua;
  5. reparar defeitos do teste em no máximo duas tentativas;
  6. não enfraquecer assertions apenas para obter resultado verde.
- A descoberta considera uma execução por projeto pretendido e diferencia repetição cross-browser de definição duplicada.
- **Status:** Resolvido.

### Correção #7 — Isolamento e paralelismo

- **Problema original:** a geração não considerava que os testes usam `fullyParallel` sobre o mesmo SQLite.
- **Antes:** havia somente orientação geral sobre fixtures e helpers.
- **Depois:**
  - cada teste deve definir sua estratégia de isolamento;
  - massa deve ser identificável e única;
  - dados devem ser removidos em `finally` ou fixture;
  - testes não podem depender da ordem ou estado deixado por outro;
  - assertions não devem depender de contagem global, posição absoluta ou seed mutável;
  - serialização deve ficar restrita ao grupo afetado;
  - banco temporário por worker pode ser proposto quando necessário.
- **Status:** Resolvido parcialmente. O prompt foi corrigido, mas o banco compartilhado e o teste legado de dashboard continuam existentes.

## Correções de prioridade Média

### Correção #8 — Deduplicação semântica

- **Problema original:** o agente verificava colisões de IDs, mas não equivalência de comportamento.
- **Antes:** buscava o próximo identificador `CT-XXX` livre.
- **Depois:** deve criar um inventário com a chave `regra + camada + ação + condição + oracle`.
- Casos equivalentes devem ser marcados como já cobertos. Casos complementares devem declarar qual cobertura nova adicionam. Testes obsoletos devem ser atualizados em vez de duplicados.
- **Status:** Resolvido.

### Correção #9 — Seleção da camada de teste

- **Problema original:** todos os casos novos eram direcionados automaticamente para specs Playwright.
- **Antes:** implementação direta em `tests/e2e/`.
- **Depois:** o agente deve escolher a menor camada fiel à regra:
  - unitário para função/regra isolável;
  - API/integração para rota-controller-model-banco e contratos;
  - UI para comportamento observável da página;
  - E2E para jornadas críticas entre camadas.
- Como não existe runner unitário dedicado, o agente deve pedir autorização antes de adicionar dependência ou configuração.
- **Status:** Resolvido parcialmente. A estratégia foi implementada, mas nenhum runner unitário foi adicionado.

### Correção #10 — Falhas externas e respostas malformadas

- **Problema original:** timeout, 401, 500 e JSON inválido não faziam parte de uma estratégia explícita para o frontend.
- **Antes:** essas falhas apareciam apenas como exemplos genéricos.
- **Depois:** mudanças no cliente HTTP ou páginas consumidoras devem avaliar, quando aplicável:
  - timeout e conexão recusada;
  - 401 e demais 4xx;
  - 500;
  - corpo não JSON;
  - `{ sucesso: false }`;
  - falha parcial.
- `page.route()` pode provocar a condição, mas o oracle deve validar a reação real da aplicação: mensagem, redirecionamento, preservação de estado, botão reabilitado e ausência de sucesso indevido.
- **Status:** Resolvido.

### Correção #11 — Automatizabilidade e ambiguidade

- **Problema original:** o agente registrava incertezas, mas não distinguia automação completa, parcial ou inviável.
- **Antes:** instrução para apenas registrar a dúvida no relatório.
- **Depois:** cada cenário deve informar:
  - `Automatizável: Sim/Parcial/Não`;
  - confiança Alta/Média/Baixa;
  - fonte do oracle;
  - parcela comprovada pela automação;
  - julgamento humano restante;
  - pergunta objetiva que desbloqueia a decisão.
- **Status:** Resolvido.

### Correção #12 — Contexto Git dinâmico

- **Problema original:** o prompt afirmava incorretamente que não havia Git nem remote configurado.
- **Antes:** estado Git fixo e já obsoleto.
- **Depois:** o agente não pode presumir branch, remote, PR ou ausência deles. Deve descobrir base, head, upstream, merge-base e PR a cada execução, registrando base SHA, head SHA e fonte da base.
- Diff vazio ou base ambígua deve interromper a geração até que a referência correta seja determinada.
- **Status:** Resolvido.

## Integração com relatório e Quality Gate

O relatório executivo agora deve preservar os novos artefatos:

- classificação semântica da mudança;
- base/head SHA e fonte da base;
- fichas de contexto;
- matriz de decisão de cobertura;
- inventário e deduplicação semântica;
- oracle e defeito detectável;
- descoberta pelo runner;
- classificação e reparo de falhas;
- validação causal;
- estratégia de isolamento;
- limitações e risco residual.

O Quality Gate também passou a exigir que:

- cada CT novo seja descoberto e executado na camada esperada;
- cada CT tenha oracle e defeito detectável explícitos;
- bugfixes possuam prova falha-antes/passa-depois;
- não existam defeitos conhecidos do teste;
- não existam duplicatas semânticas;
- dependências de estado ou ordem tenham mitigação.

## Aplicação das regras na suíte E2E

As regras do prompt atualizado foram aplicadas concretamente aos testes existentes:

- o teste API `CT-005/CT-011/CT-013/CT-015` foi dividido em criação, consulta, atualização e comentário independentes;
- o fluxo UI `CT-019` foi dividido em criação, atualização, comentário, busca e exclusão;
- todos os testes que criam chamados passaram a executar cleanup local em `finally`;
- o dashboard deixou de depender de `totalBefore + 1` em um banco compartilhado;
- o contrato visual do dashboard passou a usar uma resposta determinística e isolada;
- ações de atualizar, comentar, excluir e buscar passaram a aguardar a resposta HTTP correspondente;
- foram adicionados casos para credenciais ausentes, token inválido, categoria inválida, 404, comentário vazio, busca isolada, formulário vazio, erro 500, JSON malformado e sessão expirada;
- nenhum título de teste mantém múltiplos IDs agrupados.

### Resultado das execuções focadas

| Camada/projeto | Resultado observado | Classificação |
|---|---|---|
| API | 17/17 passaram | Testes válidos |
| Chromium | 17/18 passaram | CT-002 detectou defeito do produto |
| WebKit | 17/18 passaram | CT-002 detectou o mesmo defeito do produto |
| Firefox | 0/17 UI passaram | Falha de ambiente/engine ao criar página/contexto |

O CT-002 comprova que um 401 de credencial inválida passa pelo tratamento global de sessão expirada, recarrega a página de login e apaga a mensagem esperada. O teste foi preservado para não ocultar o defeito do produto.

Todos os comandos Playwright processaram os testes, mas o processo não encerrou depois da execução e precisou ser interrompido por timeout. Esse comportamento foi classificado como bloqueio de teardown do runner/webServer, separado dos resultados individuais.

## Adaptação para Codex

O fluxo foi disponibilizado como Skill específico deste repositório em `.agents/skills/qa-automation/`.

- `SKILL.md` contém as nove etapas adaptadas para o Codex.
- `agents/openai.yaml` fornece nome, descrição e prompt padrão para a interface.
- Foram removidas dependências específicas do Claude Code (`sonnet`, `TodoWrite` e lista fixa de ferramentas).
- A execução completa usa `npm run test:e2e`, incluindo os projetos configurados pelo Playwright.
- Commit, push, PR e comentários externos exigem autorização explícita.
- O Skill pode ser chamado com `$qa-automation` dentro deste repositório.

O inicializador e o validador Python do `skill-creator` não puderam ser executados porque não há runtime Python funcional neste Windows. A mesma estrutura foi criada manualmente e validada quanto a frontmatter, nome da pasta, metadados, nove etapas e ausência de dependências do Claude.

## Validações realizadas

- `git diff --check`: aprovado.
- O prompt, specs E2E e Page Objects listados neste documento foram alterados; nenhum arquivo em `backend/` ou `frontend/` foi modificado.
- As nove etapas originais do fluxo foram preservadas.
- Blocos Markdown e cercas de código estão balanceados.
- Treze regras críticas adicionadas foram verificadas por busca automatizada.
- A descoberta listou 69 execuções em seis arquivos, considerando API, setup e os três browsers.
- Os testes foram executados por projeto; os resultados e bloqueios estão registrados na seção anterior.

## Pendências futuras

O relatório anterior não continha itens de prioridade Baixa.

Permanecem como limitações dos itens parcialmente resolvidos:

- avaliar banco SQLite isolado por worker;
- decidir se o projeto deve receber um runner unitário dedicado.
- corrigir o tratamento de 401 no login para diferenciar credencial inválida de sessão expirada;
- diagnosticar a criação de contexto do Firefox neste ambiente;
- diagnosticar por que o processo Playwright não encerra após concluir os testes.

## Riscos para revisão antes do merge

- O prompt ficou mais longo e pode aumentar tempo e consumo de contexto do agente.
- A validação base/head pode exigir worktree, dependências e tempo adicionais.
- O Quality Gate mais rigoroso poderá reprovar mais PRs quando não houver prova causal.
- Testes com falhas externas simuladas podem ficar frágeis se os mocks forem usados além do necessário.
- A seleção de testes unitários poderá pausar aguardando autorização para adicionar ferramenta.
- O Git poderá normalizar o arquivo de LF para CRLF; não foi identificado erro de conteúdo relacionado a isso.
