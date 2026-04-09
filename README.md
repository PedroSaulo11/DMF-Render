# SISTEMA-ATUAL-DMF

Backend e interface web do sistema DMF, pronto para deploy em Render com PostgreSQL externo ou Render Postgres.

## Rodar localmente

Instalar dependencias:
```bash
npm install
```

Subir a aplicacao:
```bash
npm start
```

Modo desenvolvimento:
```bash
npm run dev
```

Webhook, se necessario:
```bash
npm run start:webhook
```

## Deploy no Render

Configurar um `Web Service` com:

- Runtime: `Node`
- Branch: `main`
- Build Command: `npm install`
- Start Command: `node server.js`
- Instance Type: conforme o plano escolhido

Variaveis minimas de ambiente:

- `NODE_ENV=production`
- `DATABASE_URL=...`
- `PG_SSL=true|false` conforme o banco
- `JWT_SECRET=...`
- `SIGNATURE_SECRET=...`
- `ENABLE_STRICT_API_ONLY_AUTH=true`

Bootstrap opcional de admin no startup:

- `ENABLE_BOOTSTRAP_ADMIN=true`
- `BOOTSTRAP_ADMIN_USERNAME=...`
- `BOOTSTRAP_ADMIN_EMAIL=...`
- `BOOTSTRAP_ADMIN_PASSWORD=...`
- `BOOTSTRAP_ADMIN_NAME=...`

Quando `ENABLE_BOOTSTRAP_ADMIN=true` e essas 4 variaveis estiverem definidas, o app cria ou atualiza um admin no banco durante o boot.
Mantenha `ENABLE_BOOTSTRAP_ADMIN=false` fora de fluxos controlados de recuperacao de acesso.

O app usa `process.env.PORT`, entao nao precisa configurar porta manualmente.

Se quiser provisionar app + banco no Render com menos cliques, use o arquivo
`render.yaml` na raiz do repositorio. Ele define:

- um `Web Service` Node
- um `Render Postgres`
- `DATABASE_URL` vinda do banco por `fromDatabase`
- secrets gerados para `JWT_SECRET` e `SIGNATURE_SECRET`

Arquivos uteis para deploy:

- `render.yaml`
- `.env.render.example`

## Checks uteis

Validacoes locais:
```bash
npm run check:baseline
```

Checklist mais completo:
```bash
npm run check:phase3
```

Checks de producao:
```bash
BASE_URL=https://seu-app.onrender.com npm run smoke:prod
BASE_URL=https://seu-app.onrender.com npm run check:audit-fallback:prod
BASE_URL=https://seu-app.onrender.com ACCESS_TOKEN=... npm run check:ops:metrics:prod
```

Go-live automatizado:
```bash
npm run go-live:check
```

## Banco e autenticacao

- O sistema usa a tabela `app_users` para login.
- O login aceita `username` ou `email`.
- Senhas sao comparadas com `bcrypt`.
- O bootstrap do schema e das roles padrao acontece no startup via Sequelize.
- O bootstrap opcional de admin usa `ENABLE_BOOTSTRAP_ADMIN=true` junto com as variaveis `BOOTSTRAP_ADMIN_*`.

## Operacao

Health check:
- `GET /api/health`

Metricas operacionais:
- `GET /api/ops/metrics` (requer `admin_access`)

Permissoes de auditoria no banco:
```bash
DB_ADMIN_URL=postgres://... DB_APP_ROLE=dmf_app npm run db:grant:audit
```

## Seguranca

- Nao versione `.env` nem `.env.render`.
- Use segredos reais apenas no ambiente do Render.
- Revise `CORS_ORIGINS`, `PG_SSL` e `DATABASE_URL` antes do deploy.
