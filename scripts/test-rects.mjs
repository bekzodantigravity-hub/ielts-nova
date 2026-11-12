import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { signSessionToken } from '../lib/auth-token.ts';

const EDGE_BIN = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CD_PORT = 9284;

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

    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      const text = await cdp.eval('document.body ? document.body.innerText : ""');
      if (text.includes('CDI Suite')) break;
    }

    const rects = await cdp.eval(`(() => {
      const h1 = document.querySelector('h1');
      const aside = document.querySelector('aside');
      const main = document.querySelector('main');
      const toObj = r => r ? { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom } : null;
      return {
        h1: toObj(h1?.getBoundingClientRect()),
        aside: toObj(aside?.getBoundingClientRect()),
        main: toObj(main?.getBoundingClientRect()),
        h1ComputedOpacity: h1 ? window.getComputedStyle(h1).opacity : null,
        mainComputedOpacity: main ? window.getComputedStyle(main).opacity : null,
        pageTransitionOpacity: document.querySelector('.page-route-transition') ? window.getComputedStyle(document.querySelector('.page-route-transition')).opacity : null,
      };
    })()`);
    console.log('Rects & Opacities:', JSON.stringify(rects, null, 2));

  } finally {
    edgeProc.kill();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
