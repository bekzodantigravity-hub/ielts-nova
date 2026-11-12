import http from 'http';
import { spawn } from 'child_process';
import path from 'path';

const CD_PORT = 9247;
const EDGE_BIN = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function run() {
  const edgeProc = spawn(EDGE_BIN, [
    `--remote-debugging-port=${CD_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,720',
    `--user-data-dir=${path.join(process.cwd(), '.data', 'edge_debug_1')}`,
    'http://localhost:3000'
  ]);

  await sleep(2500);
  const version = await fetchJson(`http://127.0.0.1:${CD_PORT}/json/version`);
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    return new Promise(resolve => {
      const curId = id++;
      const handler = (msg) => {
        const p = JSON.parse(msg.data.toString());
        if (p.id === curId) {
          ws.removeEventListener('message', handler);
          resolve(p.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  ws.addEventListener('message', (msg) => {
    const p = JSON.parse(msg.data.toString());
    if (p.method === 'Runtime.consoleAPICalled') {
      console.log('[Browser console]', p.params.type, p.params.args.map(a => a.value));
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');

  await sleep(1500);
  // Open modal
  await send('Runtime.evaluate', {
    expression: 'document.querySelector("[data-testid=\\"landing-start-free-btn\\"]")?.click()',
    returnByValue: true
  });
  await sleep(1500);

  // Check card
  const checkCard = await send('Runtime.evaluate', {
    expression: 'Boolean(document.querySelector("[data-testid=\\"account-card-antigravity@gmail.com\\"]"))',
    returnByValue: true
  });
  console.log('Card in DOM:', checkCard?.value);

  // Click card
  const clickCard = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-testid="account-card-antigravity@gmail.com"]');
      if (!card) return 'Not found';
      card.click();
      return 'Clicked!';
    })()`,
    returnByValue: true
  });
  console.log('Click result:', clickCard?.value);

  await sleep(2000);
  const urlNow = await send('Runtime.evaluate', { expression: 'location.href', returnByValue: true });
  console.log('URL after click:', urlNow?.value);

  ws.close();
  edgeProc.kill();
}

run().catch(console.error);
