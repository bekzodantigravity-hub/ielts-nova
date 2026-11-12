import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { signSessionToken } from '../lib/auth-token.ts';

const EDGE_BIN = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\ec2e52f9-f4ab-4f5d-815d-664331c3fae7';
const CD_PORT = 9289;

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
  const tmpUserData = path.join(process.cwd(), '.data', 'edge_style_' + Date.now());
  fs.mkdirSync(tmpUserData, { recursive: true });

  const edgeProc = spawn(EDGE_BIN, [
    `--remote-debugging-port=${CD_PORT}`,
    '--headless=new',
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

    console.log('Navigating to http://localhost:3000/dashboard...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/dashboard' });

    // Wait until hero card actually has computed background
    for (let i = 0; i < 20; i++) {
      await sleep(1000);
      const bg = await cdp.eval(`(() => {
        const h1 = document.querySelector('h1');
        const card = h1 ? h1.closest('div.relative.overflow-hidden') : null;
        if (!card) return null;
        const style = window.getComputedStyle(card);
        return {
          bgImage: style.backgroundImage,
          bgColor: style.backgroundColor,
          color: style.color,
          h1Color: window.getComputedStyle(h1).color,
          width: card.offsetWidth,
          height: card.offsetHeight
        };
      })()`);
      console.log(`[T+${i + 1}s] Computed style:`, JSON.stringify(bg));
      if (bg && bg.bgImage && bg.bgImage.includes('gradient')) {
        console.log('GRADIENT STYLES APPLIED!');
        break;
      }
    }

    await sleep(1000);

    const resJpeg = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
    });
    const buf = Buffer.from(resJpeg.data, 'base64');
    console.log('PNG bytes:', buf.length);
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'dash-styled.png'), buf);

  } finally {
    edgeProc.kill();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
