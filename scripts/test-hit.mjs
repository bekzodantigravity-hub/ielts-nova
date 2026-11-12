import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { signSessionToken } from '../lib/auth-token.ts';

const EDGE_BIN = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CD_PORT = 9285;

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
  const tmpUserData = path.join(process.cwd(), '.data', 'edge_inspect_' + Date.now());
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
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    const cdp = new CdpSession(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    const { token } = await signSessionToken({
      sub: 'usr_jasur_test',
      email: 'jasur@test.com',
      name: 'Jasur Karimov',
      birthYear: 2005,
      age: 21,
      goal: "Chet elda ta'lim",
      targetBand: 8.0,
      dailyGoal: 40,
      provider: 'google',
    });

    await cdp.send('Page.navigate', { url: 'http://localhost:3000' });
    await sleep(1500);

    await cdp.eval(`
      document.cookie = "ielts_nova_session=${token}; path=/; max-age=604800";
    `);

    await cdp.send('Page.navigate', { url: 'http://localhost:3000/dashboard' });
    await sleep(2500);

    const hit = await cdp.eval(`(() => {
      const el = document.elementFromPoint(500, 300);
      const elTop = document.elementFromPoint(100, 100);
      const elCenter = document.elementFromPoint(640, 400);
      return {
        point500_300: el ? { tag: el.tagName, class: el.className, id: el.id, text: el.innerText?.substring(0, 50) } : null,
        point100_100: elTop ? { tag: elTop.tagName, class: elTop.className, id: elTop.id, text: elTop.innerText?.substring(0, 50) } : null,
        point640_400: elCenter ? { tag: elCenter.tagName, class: elCenter.className, id: elCenter.id, text: elCenter.innerText?.substring(0, 50) } : null,
      };
    })()`);
    console.log('Elements at points:', JSON.stringify(hit, null, 2));

  } finally {
    edgeProc.kill();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
