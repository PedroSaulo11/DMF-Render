/* eslint-disable no-console */
class OpsMetricsAssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OpsMetricsAssertionError';
  }
}

function assert(condition, message) {
  if (!condition) throw new OpsMetricsAssertionError(message);
}

function env(name) {
  return String(process.env[name] || '').trim();
}

async function main() {
  const base = env('BASE_URL');
  const token = env('ACCESS_TOKEN');
  assert(base, 'BASE_URL is required (e.g. https://project-...appspot.com)');
  assert(token, 'ACCESS_TOKEN is required for /api/ops/metrics');

  const url = `${base.replace(/\/+$/, '')}/api/ops/metrics`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  assert(response.ok, `/api/ops/metrics failed: HTTP ${response.status}`);
  const body = await response.json();
  assert(typeof body.requests_total === 'number', 'requests_total missing');
  assert(body.responses_by_status && typeof body.responses_by_status === 'object', 'responses_by_status missing');
  assert(typeof body.auth_failures === 'number', 'auth_failures missing');
  assert(typeof body.login_failures === 'number', 'login_failures missing');
  assert(typeof body.login_lockouts === 'number', 'login_lockouts missing');
  assert(body.runtime && typeof body.runtime === 'object', 'runtime missing');
  console.log('[ops-metrics] PASS');
}

main().catch((error) => {
  const message = error && error.message ? error.message : String(error);
  console.error(`[ops-metrics] FAIL ${message}`);
  process.exit(1);
});
