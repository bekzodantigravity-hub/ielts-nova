// Measures first-request (cold compile) latency of `next dev` for public routes.
// Usage: node scripts/measure-dev-latency.mjs [--turbopack]
import { spawn, execSync } from 'child_process';
import fs from 'fs';

const turbo = process.argv.includes('--turbopack');
const PORT = turbo ? 3102 : 3101;
const ROUTES = ['/', '/writing', '/api/auth/session', '/api/auth/sync'];

fs.rmSync('.next', { recursive: true, force: true });

const args = ['next', 'dev', '-p', String(PORT), ...(turbo ? ['--turbopack'] : [])];
const proc = spawn('npx', args, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });

let ready = false;
proc.stdout.on('data', (d) => { if (String(d).includes('Ready')) ready = true; });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 120 && !ready; i++) await sleep(500);
console.log(`[${turbo ? 'turbopack' : 'webpack'}] server ready: ${ready}`);

for (const route of ROUTES) {
  const t0 = Date.now();
  try {
    const res = await fetch(`http://localhost:${PORT}${route}`, { redirect: 'manual' });
    await res.text();
    console.log(`  first  ${route.padEnd(20)} ${res.status}  ${Date.now() - t0} ms`);
  } catch (e) {
    console.log(`  first  ${route.padEnd(20)} ERR ${e.message}`);
  }
  const t1 = Date.now();
  try {
    const res = await fetch(`http://localhost:${PORT}${route}`, { redirect: 'manual' });
    await res.text();
    console.log(`  second ${route.padEnd(20)} ${res.status}  ${Date.now() - t1} ms`);
  } catch {}
}

try { execSync(`taskkill /F /T /PID ${proc.pid}`, { stdio: 'ignore' }); } catch {}
process.exit(0);
