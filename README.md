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

O app usa `process.env.PORT`, entao nao precisa configurar porta manualmente.

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
