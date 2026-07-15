# Help Desk — Sistema de Gerenciamento de Chamados

Sistema web simples e funcional para controle de solicitações internas de uma empresa (POC).

## Tecnologias

- **Backend:** Node.js + Express + SQLite (better-sqlite3)
- **Autenticação:** JWT (JSON Web Token) + senhas com hash bcrypt
- **Frontend:** HTML, CSS e JavaScript puro (sem frameworks)

## Como rodar

```bash
cd backend
npm install
npm start
```

O servidor sobe em **http://localhost:3000** e já serve o frontend automaticamente.
O banco de dados SQLite é criado e populado com dados de exemplo na primeira execução.

### Login de demonstração

| E-mail              | Senha  |
|----------------------|--------|
| admin@empresa.com    | 123456 |
| joao@empresa.com     | 123456 |

## Estrutura do projeto

```
helpdesk/
├── backend/
│   ├── controllers/     # Lógica de negócio (auth, tickets, comentários, dashboard)
│   ├── routes/          # Definição das rotas Express
│   ├── models/          # Acesso ao banco de dados (queries SQL)
│   ├── middleware/       # Middleware de autenticação JWT
│   ├── database/        # Schema, seed e arquivo .sqlite
│   └── server.js        # Ponto de entrada da aplicação
│
└── frontend/
    ├── pages/           # login, dashboard, tickets, ticket-form, ticket-detail, profile
    ├── components/       # Sidebar reutilizável (JS)
    ├── css/              # Estilos globais (design tokens)
    └── js/               # Cliente de API + lógica de cada página
```

## Funcionalidades

- **Login** com sessão via JWT (válido por 8h)
- **Dashboard** com totais e gráficos de barra (status, categoria, prioridade)
- **CRUD completo de chamados**, com histórico automático de alterações
- **Comentários** por chamado
- **Pesquisa** por título (com debounce), **filtros** por status/prioridade e **ordenação**
- **Paginação** na listagem
- **Validação** de campos obrigatórios no frontend e no backend
- **Mensagens de sucesso/erro** (toasts)

## API REST

| Método | Rota                          | Descrição                          |
|--------|-------------------------------|-------------------------------------|
| POST   | `/api/login`                  | Autenticação                        |
| GET    | `/api/perfil`                 | Dados do usuário logado             |
| GET    | `/api/tickets`                | Lista chamados (busca/filtros/paginação) |
| GET    | `/api/tickets/:id`            | Detalhes, comentários e histórico   |
| POST   | `/api/tickets`                | Cria chamado                        |
| PUT    | `/api/tickets/:id`            | Atualiza chamado                    |
| DELETE | `/api/tickets/:id`            | Remove chamado                      |
| POST   | `/api/tickets/:id/comentarios`| Adiciona comentário                 |
| GET    | `/api/dashboard`               | Estatísticas para o dashboard       |

Todas as rotas (exceto `/api/login`) exigem o header `Authorization: Bearer <token>`.

## Banco de dados

- **usuarios**: id, nome, email, senha (hash)
- **chamados**: id, titulo, descricao, categoria, prioridade, status, solicitante, data_abertura, data_atualizacao
- **comentarios**: id, chamado_id, comentario, usuario, data
- **historico**: id, chamado_id, alteracao, usuario, data (registro automático de mudanças)

## Observações de segurança (POC)

Este projeto é uma prova de conceito. Para produção, recomenda-se: usar variável de ambiente para `JWT_SECRET`, HTTPS, rate limiting no login, e política de senhas mais robusta.

## QA

- [Pipeline de QA e automacao](docs/qa-automation-pipeline.md)
- [Agente de QA para escrita de casos de teste](docs/qa-agent.md)
- [Casos de teste iniciais do projeto](docs/test-cases.md)

## Automacao Playwright

- [Agente de automacao Playwright](docs/playwright-automation-agent.md)

Comandos principais:

```bash
npm install
npx playwright install
npm run test:e2e
```

