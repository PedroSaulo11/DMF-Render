/* eslint-disable no-console */
function env(name, fallback = '') {
  const raw = process.env[name];
  if (raw == null || raw === '') return String(fallback || '').trim();
  return String(raw).trim();
}

function required(name) {
  const value = env(name, '');
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function request(url, { method = 'GET', token = '', body = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (_) {
    json = null;
  }
  return { status: res.status, text, json };
}

async function login(base) {
  const username = env('TEST_USERNAME', '');
  const password = env('TEST_PASSWORD', '');
  if (!username || !password) return null;
  const res = await request(`${base}/api/auth/login`, {
    method: 'POST',
    body: { username, password }
  });
  if (res.status !== 200 || !res.json?.token) {
    throw new Error(`Login failed in session check: HTTP ${res.status} body=${res.text.slice(0, 250)}`);
  }
  return res.json.token;
}

async function main() {
  const base = required('BASE_URL').replace(/\/+$/, '');

  const health = await request(`${base}/api/health`);
  assert(health.status === 200, `health failed: HTTP ${health.status}`);
  const httpOnlyEnabled = health.json?.feature_flags?.enable_httponly_session === true;
  console.log(`[session-check] health ok enable_httponly_session=${httpOnlyEnabled}`);

  const noToken = await request(`${base}/api/auth/user-status`, { method: 'GET' });
  assert(noToken.status === 401, `user-status without token expected 401, got ${noToken.status}`);

  const invalidToken = await request(`${base}/api/auth/user-status`, {
    method: 'GET',
    token: 'invalid.token.value'
  });
  assert(invalidToken.status === 401, `user-status invalid token expected 401, got ${invalidToken.status}`);

  const refresh = await request(`${base}/api/auth/user-refresh`, {
    method: 'POST',
    body: {}
  });
  if (httpOnlyEnabled) {
    assert(refresh.status === 401, `user-refresh without cookie expected 401 when enabled, got ${refresh.status}`);
  } else {
    assert(refresh.status === 404, `user-refresh expected 404 when disabled, got ${refresh.status}`);
  }
  console.log('[session-check] refresh contract ok');

  const token = await login(base);
  if (token) {
    const status = await request(`${base}/api/auth/user-status`, { method: 'GET', token });
    assert(status.status === 200, `user-status after login failed: HTTP ${status.status}`);

    const logout = await request(`${base}/api/auth/logout`, { method: 'POST' });
    assert(logout.status === 200, `logout failed: HTTP ${logout.status}`);
    console.log('[session-check] login/logout contract ok');
  } else {
    console.log('[session-check] SKIP login/logout (TEST_USERNAME/TEST_PASSWORD not set)');
  }

  console.log('[session-check] PASS');
}

main().catch((error) => {
  console.error('[session-check] FAIL', error && error.stack ? error.stack : error);
  process.exit(1);
});
