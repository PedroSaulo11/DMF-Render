/* Readiness checks for the Render deployment flow. */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
let hasFailure = false;

function fail(msg) {
  hasFailure = true;
  console.error(`[READINESS][FAIL] ${msg}`);
}

function warn(msg) {
  console.warn(`[READINESS][WARN] ${msg}`);
}

function ok(msg) {
  console.log(`[READINESS][OK] ${msg}`);
}

function readFile(file) {
  try {
    return fs.readFileSync(path.join(root, file), 'utf8');
  } catch (_) {
    return null;
  }
}

function checkPackageJson() {
  const raw = readFile('package.json');
  if (!raw) {
    fail('package.json nao encontrado.');
    return;
  }

  let pkg = null;
  try {
    pkg = JSON.parse(raw);
  } catch (error) {
    fail(`package.json invalido: ${error.message}`);
    return;
  }

  const nodeVersion = String(pkg.engines?.node || '').trim();
  if (!nodeVersion) {
    fail('engines.node ausente em package.json.');
  } else {
    ok(`engines.node configurado: ${nodeVersion}`);
  }
}

function checkEnvExample() {
  const envExample = readFile('.env.example');
  if (!envExample) {
    fail('.env.example nao encontrado.');
    return;
  }

  const requiredKeys = [
    'NODE_ENV',
    'DATABASE_URL',
    'PG_SSL',
    'JWT_SECRET',
    'SIGNATURE_SECRET'
  ];

  for (const key of requiredKeys) {
    if (!new RegExp(`^${key}=`, 'm').test(envExample)) {
      fail(`.env.example sem chave obrigatoria: ${key}.`);
    } else {
      ok(`${key} presente em .env.example.`);
    }
  }
}

function checkActiveFiles() {
  const requiredFiles = ['server.js', 'db.js', 'package.json', '.env.example'];

  for (const file of requiredFiles) {
    if (fs.existsSync(path.join(root, file))) {
      ok(`Arquivo ativo presente: ${file}`);
    } else {
      fail(`Arquivo ativo ausente: ${file}`);
    }
  }
}

checkPackageJson();
checkEnvExample();
checkActiveFiles();

if (hasFailure) {
  process.exit(1);
}

ok('Readiness check finalizado.');


