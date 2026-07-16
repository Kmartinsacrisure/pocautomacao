# Como Configurar o Agente de QA em um Novo Projeto

## Pré-requisitos
- Claude Code instalado
- Projeto usa (ou vai usar) Playwright para testes
- Acesso de escrita ao repositório no GitHub

---

## Passo 1 — Preparar os testes
1. Criar `playwright.config.js` na raiz do projeto.
2. Criar uma fixture de evidências (screenshots, logs e chamadas de API salvos automaticamente durante os testes).
3. Adicionar a pasta de evidências ao `.gitignore`.

## Passo 2 — Criar o agente
1. Criar o arquivo `.claude/agents/qa-automation.md`.
2. Definir o fluxo de validação: analisar mudanças → gerar casos de teste → rodar os testes → gerar evidências → publicar relatório na Pull Request.
3. Definir o critério de aprovação/reprovação (Quality Gate).
4. Testar o agente em uma mudança pequena antes de usar em uma PR real.

## Passo 3 — Configurar o Git
1. `git init`
2. Conferir o `.gitignore` (banco de dados, `node_modules`, arquivos `.env`, evidências de teste).
3. `git add .` e depois `git status` para revisar antes de commitar.
4. `git commit -m "mensagem"`

## Passo 4 — Conectar ao GitHub
1. Criar um repositório vazio no GitHub.
2. `git remote add origin <URL do repositório>`
3. `git push -u origin main`

**Se der erro de permissão (403):** gerar um Personal Access Token (PAT) com acesso de escrita ao repositório e usá-lo para autenticar o push.

---

## Checklist final
- [ ] Testes configurados e rodando
- [ ] Agente criado e testado
- [ ] `.gitignore` revisado
- [ ] Repositório conectado ao GitHub com sucesso

---

## Importante saber
- O agente ainda não bloqueia o merge sozinho — apenas reporta o resultado.
- Cada execução consome uso da conta de IA.
