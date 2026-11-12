import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const EDGE_BIN = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CD_PORT = 9320;
const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\ec2e52f9-f4ab-4f5d-815d-664331c3fae7';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
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
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACTS_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`[Dark Screenshot Saved] -> ${outPath}`);
    return outPath;
  }
}

async function main() {
  const dataDir = path.resolve('.data', `edge_dark_${Date.now()}`);
  fs.mkdirSync(dataDir, { recursive: true });

  const edgeProc = spawn(EDGE_BIN, [
    `--remote-debugging-port=${CD_PORT}`,
    `--user-data-dir=${dataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,850',
    'about:blank',
  ]);

  await sleep(1500);

  try {
    const targets = await fetchJson(`http://localhost:${CD_PORT}/json`);
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    const cdp = new CdpSession(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    await cdp.send('Page.navigate', { url: 'http://localhost:3000/dashboard' });
    await sleep(2000);

    // Set dark theme in localStorage & toggle document.documentElement
    await cdp.eval(`
      (() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('ielts-nova:theme', 'dark');
      })()
    `);
    await sleep(400);

    await cdp.captureScreenshot('verify-dashboard-dark-clean.png');
    console.log('Dark mode screenshot captured successfully!');
  } finally {
    edgeProc.kill();
  }
}

main().catch(console.error);
