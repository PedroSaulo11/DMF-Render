/* eslint-disable no-console */

function mustEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function hit(url, headers = {}) {
  const res = await fetch(url, { method: 'GET', headers });
  return { status: res.status, body: await res.text() };
}

async function main() {
  const baseUrl = mustEnv('BASE_URL').replace(/\/+$/, '');

  const noToken = await hit(`${baseUrl}/api/auth/user-status`);
  assert(noToken.status === 401 || noToken.status === 503, `Expected 401/503 without token, got ${noToken.status}`);

  const invalid = await hit(`${baseUrl}/api/auth/user-status`, {
    Authorization: 'Bearer invalid.token.value'
  });
  assert(invalid.status === 401 || invalid.status === 503, `Expected 401/503 with invalid token, got ${invalid.status}`);

  console.log(`[audit-fallback] PASS base=${baseUrl}`);
}

main().catch((err) => {
  console.error('[audit-fallback] FAIL', err && err.stack ? err.stack : err);
  process.exit(1);
});
