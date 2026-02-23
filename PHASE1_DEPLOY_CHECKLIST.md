# Fase 1 - Checklist de Deploy e Rollback

## Antes do deploy
- Criar branch de trabalho:
  - `git checkout -b chore/phase1-phase2-safe-rollout`
- Registrar estado inicial:
  - `git rev-parse --short HEAD`
  - `git status --short --branch`
- Gerar backup/snapshot antes de qualquer deploy:
  - `POST /tasks/backup` (cron/internal) ou rotina equivalente no ambiente.
- Verificar `git status` limpo no branch de deploy.
- Confirmar build sem erro de sintaxe:
  - `node --check server.js`
  - `node --check script.js`
  - `node --check bootstrap.js`
- Rodar baseline de nao regressao:
  - `npm run check:baseline`
- Confirmar variaveis de ambiente no GCloud:
  - `NODE_ENV=production`
  - `JWT_SECRET` definido
  - `CORS_ORIGINS` com dominio correto
  - feature flags novas em `false`:
    - `ENABLE_REDIS_CACHE=false`
    - `ENABLE_DISTRIBUTED_RATE_LIMIT=false`
    - `ENABLE_PUBSUB_SSE=false`
    - `ENABLE_STRICT_API_ONLY_AUTH=false`
    - `ENABLE_HTTPONLY_SESSION=false`

## Deploy
- Publicar nova versao no App Engine.
- Aguardar health:
  - `GET /api/health` retorna `200`.
  - `boot.ready=true`.
  - `feature_flags` refletindo os valores esperados.

## Smoke test (obrigatorio)
- Login com usuario admin.
- Login com usuario gestor financeiro.
- Abrir `Fluxo de Pagamentos` e validar botoes por permissao.
- Abrir `Dashboard` e confirmar cards atualizando sem trocar de aba.
- Abrir rota direta:
  - `/admin.html`
  - `/dashboard.html`
  - confirmar redirecionamento para `/?tab=...`.
- Validar que nada regrediu:
  - importacao de pagamentos.
  - assinatura de pagamento.
  - arquivamento de fluxo.

## Se algo falhar (rollback)
- Promover versao anterior no App Engine.
- Reverter feature flags alteradas para `false`.
- Limpar cache do navegador (`Ctrl+Shift+R`) nos clientes.
- Revalidar `GET /api/health` e login.
