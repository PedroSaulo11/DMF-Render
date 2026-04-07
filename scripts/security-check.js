/* Render-oriented security preflight. */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
let hasFailure = false;

function fail(msg) {
  hasFailure = true;
  console.error(`[SECURITY][FAIL] ${msg}`);
}

function warn(msg) {
  console.warn(`[SECURITY][WARN] ${msg}`);
}

function ok(msg) {
  console.log(`[SECURITY][OK] ${msg}`);
}

function readTextIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (_) {
    return null;
  }
}

function checkEnvExample() {
  const envExample = readTextIfExists(path.join(root, '.env.example'));
  if (!envExample) {
    fail('.env.example nao encontrado.');
    return;
  }

  const requiredKeys = ['DATABASE_URL', 'JWT_SECRET', 'SIGNATURE_SECRET'];
  for (const key of requiredKeys) {
    if (!new RegExp(`^${key}=`, 'm').test(envExample)) {
      fail(`.env.example sem chave obrigatoria: ${key}.`);
    } else {
      ok(`${key} presente em .env.example.`);
    }
  }
}

function checkGitignore() {
  const gitignore = readTextIfExists(path.join(root, '.gitignore'));
  if (!gitignore) {
    warn('.gitignore nao encontrado.');
    return;
  }

  if (!/^\.env$/m.test(gitignore) && !/^\*\.env$/m.test(gitignore)) {
    fail('.env nao esta ignorado pelo Git.');
  } else {
    ok('.env ignorado pelo Git.');
  }

  if (!/^\.env\.render$/m.test(gitignore)) {
    fail('.env.render nao esta ignorado pelo Git.');
  } else {
    ok('.env.render ignorado pelo Git.');
  }
}

checkEnvExample();
checkGitignore();

if (hasFailure) {
  process.exit(1);
}

ok('Security preflight finalizado.');


