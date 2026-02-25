/* eslint-disable no-console */
const { randomUUID } = require('crypto');

function env(name, fallback = '') {
  const raw = process.env[name];
  if (raw == null || raw === '') return String(fallback || '').trim();
  return String(raw).trim();
}

function envBool(name, fallback = false) {
  const raw = env(name, '');
  if (!raw) return !!fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
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

async function resolveToken(base) {
  const accessToken = env('ACCESS_TOKEN', '');
  if (accessToken) {
    const probe = await request(`${base}/api/auth/user-status`, {
      method: 'GET',
      token: accessToken
    });
    if (probe.status === 200) return accessToken;
    console.warn(`[multiuser-access] WARN ACCESS_TOKEN invalid (HTTP ${probe.status}), trying login fallback`);
  }

  const username = env('TEST_USERNAME', '');
  const password = env('TEST_PASSWORD', '');
  if (!username || !password) {
    throw new Error('ACCESS_TOKEN invalid/missing and TEST_USERNAME/TEST_PASSWORD are not set');
  }

  const login = await request(`${base}/api/auth/login`, {
    method: 'POST',
    body: { username, password }
  });
  if (login.status !== 200 || !login.json?.token) {
    throw new Error(`Fallback login failed: HTTP ${login.status} body=${login.text.slice(0, 250)}`);
  }
  return login.json.token;
}

async function main() {
  const base = required('BASE_URL').replace(/\/+$/, '');
  const company = env('TEST_COMPANY', 'DMF');
  const forbiddenCompany = env('TEST_COMPANY_FORBIDDEN', '');
  const checkWrite = envBool('CHECK_WRITE_ACCESS', true);
  const allowNonAdminWriteProbe = envBool('ALLOW_NONADMIN_WRITE_PROBE', false);
  const checkTenantIsolation = envBool('CHECK_TENANT_ISOLATION', !!forbiddenCompany);

  const token = await resolveToken(base);
  const userStatus = await request(`${base}/api/auth/user-status`, {
    method: 'GET',
    token
  });
  assert(userStatus.status === 200, `user-status failed: HTTP ${userStatus.status}`);
  const role = userStatus.json?.user?.role || 'unknown';
  const perms = userStatus.json?.user?.permissions || userStatus.json?.permissions || [];
  console.log(`[multiuser-access] auth ok role=${role} perms=${Array.isArray(perms) ? perms.length : 0}`);

  const list = await request(`${base}/api/flow-payments?company=${encodeURIComponent(company)}`, {
    method: 'GET',
    token
  });
  assert(list.status === 200, `flow list denied for TEST_COMPANY=${company}: HTTP ${list.status} body=${list.text.slice(0, 250)}`);
  console.log(`[multiuser-access] list ok company=${company}`);

  if (checkTenantIsolation && forbiddenCompany) {
    const denied = await request(`${base}/api/flow-payments?company=${encodeURIComponent(forbiddenCompany)}`, {
      method: 'GET',
      token
    });
    if (denied.status === 200) {
      throw new Error(`tenant isolation failed: access to forbidden company ${forbiddenCompany} returned 200`);
    }
    if (denied.status !== 403 && denied.status !== 400) {
      throw new Error(`tenant isolation unexpected status for ${forbiddenCompany}: HTTP ${denied.status}`);
    }
    console.log(`[multiuser-access] tenant isolation ok forbidden=${forbiddenCompany} status=${denied.status}`);
  }

  if (checkWrite) {
    const normalizedRole = String(role || '').trim().toLowerCase();
    const canAddPayments = Array.isArray(perms) && (perms.includes('all') || perms.includes('add_payments'));
    const canDeletePayments = normalizedRole === 'admin';

    // Write probe is always executed for admin. For non-admin, only when explicitly enabled.
    if (!canDeletePayments && !allowNonAdminWriteProbe) {
      if (canAddPayments) {
        console.log('[multiuser-access] SKIP write probe for non-admin to avoid orphan test data (set ALLOW_NONADMIN_WRITE_PROBE=true to force)');
      } else {
        console.log('[multiuser-access] write denied by role/permission as expected for non-admin');
      }
      console.log('[multiuser-access] PASS');
      return;
    }

    const paymentId = `rbac-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const create = await request(`${base}/api/flow-payments?company=${encodeURIComponent(company)}`, {
      method: 'POST',
      token,
      body: {
        id: paymentId,
        fornecedor: 'RBAC Probe',
        data: '25/02/2026',
        descricao: 'RBAC access probe',
        valor: 1.23,
        centro: 'Teste',
        categoria: 'Operacional',
        company
      }
    });
    if (canAddPayments) {
      assert(create.status === 200, `flow create denied for TEST_COMPANY=${company}: HTTP ${create.status} body=${create.text.slice(0, 250)}`);
    } else {
      assert(create.status === 403, `flow create should be denied for role=${role}, got HTTP ${create.status} body=${create.text.slice(0, 250)}`);
      console.log('[multiuser-access] create denied as expected for current role');
      console.log('[multiuser-access] PASS');
      return;
    }
    console.log('[multiuser-access] create ok');

    const del = await request(`${base}/api/flow-payments/${encodeURIComponent(paymentId)}?company=${encodeURIComponent(company)}`, {
      method: 'DELETE',
      token
    });
    if (canDeletePayments) {
      assert(del.status === 200, `flow delete denied for TEST_COMPANY=${company}: HTTP ${del.status} body=${del.text.slice(0, 250)}`);
      console.log('[multiuser-access] delete ok');
    } else {
      assert(del.status === 403, `flow delete should be denied for role=${role}, got HTTP ${del.status} body=${del.text.slice(0, 250)}`);
      console.log('[multiuser-access] delete denied as expected for non-admin');
    }
  } else {
    console.log('[multiuser-access] SKIP write checks (CHECK_WRITE_ACCESS=false)');
  }

  console.log('[multiuser-access] PASS');
}

main().catch((error) => {
  console.error('[multiuser-access] FAIL', error && error.stack ? error.stack : error);
  process.exit(1);
});
