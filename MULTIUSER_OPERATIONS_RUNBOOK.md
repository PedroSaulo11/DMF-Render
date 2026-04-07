# Runbook Operacional Multiusuário

## Objetivo
Padronizar resposta a incidentes de produção para o cenário multiusuário sem interromper funcionalidades já estáveis.

## Sinais de incidente
- Aumento de `5xx` no ambiente de producao.
- Falha em `Post-Deploy Multiuser Validation`.
- `redis_ready=false` ou `sse_pubsub.subscribed=false` em `/api/health`.
- `load:prod:multiuser` com `create:403` ou `fail>0`.

## Passo 1 - Triage rápido (5 minutos)
1. Confirmar saúde:
```bash
curl -s "$BASE_URL/api/health"
```
2. Confirmar métricas operacionais:
```bash
BASE_URL=... ACCESS_TOKEN=... npm run check:ops:metrics:prod
```
3. Confirmar autenticação do usuário de teste:
```bash
BASE_URL=... TEST_USERNAME=... TEST_PASSWORD=... npm run check:session:prod
```
4. Confirmar RBAC + tenant:
```bash
BASE_URL=... ACCESS_TOKEN=... TEST_COMPANY=... TEST_COMPANY_FORBIDDEN=... npm run check:multiuser:access:prod
```

## Passo 2 - Classificação e ação imediata
- `health=500` ou boot error:
  - revisar deploy, variaveis de ambiente e logs do provedor atual.
- `redis_ready=false`:
  - validar `REDIS_URL` secret, conectividade e flags distribuídas.
- `create:403` no load:
  - corrigir permissões/empresa do usuário de teste (`app_user_companies` + role permissions).
- `429` em login:
  - verificar lockout por tentativas (`LOGIN_LOCK_MAX_ATTEMPTS`, `LOGIN_LOCK_DURATION_MS`).
- `sse timeout` recorrente:
  - validar assinatura Redis pub/sub e latência de rede entre runner e serviço.

## Passo 3 - Revalidação pós-correção
1. Rodar workflow:
```bash
gh workflow run "Post-Deploy Multiuser Validation" -R PedroSaulo11/SISTEMA-ATUAL-DMF
```
2. Critério de saída:
- Workflow verde com `STRICT_SESSION_CHECK=true`, `STRICT_ACCESS_CHECK=true`, `STRICT_LOAD_CHECK=true`.
- Sem `fail>0` no load test.

## Passo 4 - Prevenção
- Manter `TEST_COMPANY_FORBIDDEN` definido nos secrets do GitHub.
- Configurar limites de latência (`LOAD_MAX_P95_MS`, `LOAD_MAX_REQUEST_MS`) por ambiente.
- Não desabilitar checks estritos no workflow principal.
