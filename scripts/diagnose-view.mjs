import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { signSessionToken } from '../lib/auth-token.ts';

const EDGE_BIN = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CD_PORT = 9279;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

class CdpSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    this.ws.onmessage = (event) => {
      const parsed = JSON.parse(event.data.toString());
      if (parsed.id && this.callbacks.has(parsed.id)) {
        const { resolve, reject } = this.callbacks.get(parsed.id);
        this.callbacks.delete(parsed.id);
        if (parsed.error) reject(parsed.error);
        else resolve(parsed.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }
}

async function run() {
  const tmpUserData = path.join(process.cwd(), '.data', 'edge_diag_' + Date.now());
  fs.mkdirSync(tmpUserData, { recursive: true });

  const edgeProc = spawn(EDGE_BIN, [
    `--remote-debugging-port=${CD_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,800',
    `--user-data-dir=${tmpUserData}`,
    'about:blank',
  ]);

  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      await sleep(300);
      try {
        targets = await fetchJson(`http://127.0.0.1:${CD_PORT}/json`);
        if (targets && targets.length > 0) break;
      } catch (_) {}
    }
    if (!targets || !targets[0]) throw new Error('Could not connect to Edge');
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    const cdp = new CdpSession(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');

    const { token } = await signSessionToken({
      sub: 'usr_jasur_test',
      email: 'jasur@test.com',
      name: 'Jasur Karimov',
      birthYear: 2005,
      age: 21,
      goal: "Chet elda ta'lim",
      targetBand: 8.0,
      dailyGoal: 40,
    });

    await cdp.send('Page.navigate', { url: 'http://localhost:3000' });
    await sleep(2000);

    // Set cookie
    await cdp.eval(`document.cookie = "ielts_nova_session=${token}; path=/; max-age=604800";`);
    await sleep(300);

    console.log('Navigating to http://localhost:3000/dashboard...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/dashboard' });

    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      try {
        const info = await cdp.eval(`(() => {
          return {
            status: window.__LAYOUT_STATUS || 'none',
            data: window.__LAYOUT_DATA || 'none',
            body: document.body ? document.body.innerText.substring(0, 100).replace(/\\n/g, ' ') : '',
          };
        })()`);
        console.log(`[T+${i + 1}s]`, JSON.stringify(info));
        if (info.body.includes('CDI Suite') || info.body.includes('Jasur Karimov')) {
          console.log('RENDERED SUCCESSFULLY!');
          break;
        }
      } catch (err) {
        console.log(`[T+${i + 1}s eval err]`, err.message);
      }
    }

  } finally {
    edgeProc.kill();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
