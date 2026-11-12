import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const EDGE_BIN = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CD_PORT = 9301;

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
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }
}

async function run() {
  const tmpUserData = path.join(process.cwd(), '.data', 'edge_test_click_' + Date.now());
  fs.mkdirSync(tmpUserData, { recursive: true });

  const edgeProc = spawn(EDGE_BIN, [
    `--remote-debugging-port=${CD_PORT}`,
    '--headless=new',
    '--no-sandbox',
    '--window-size=1280,850',
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

    await cdp.send('Page.navigate', { url: 'http://localhost:3000/writing' });
    
    // Poll until button exists
    for (let i = 0; i < 25; i++) {
      await sleep(1000);
      const ready = await cdp.eval('Boolean(document.getElementById("start-exam-btn"))');
      console.log(`[Wait ${i + 1}s] start-exam-btn exists:`, ready);
      if (ready) break;
    }

    // Get position of start button
    const box = await cdp.eval(`(() => {
      const btn = document.getElementById('start-exam-btn');
      if (!btn) return null;
      btn.scrollIntoView({ block: 'center' });
      const r = btn.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
    })()`);
    console.log('Button box after scroll:', box);

    if (box) {
      await sleep(400);
      // Dispatch real CDP Input.dispatchMouseEvent
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: Math.round(box.x),
        y: Math.round(box.y),
        button: 'left',
        clickCount: 1,
      });
      await sleep(100);
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: Math.round(box.x),
        y: Math.round(box.y),
        button: 'left',
        clickCount: 1,
      });
      console.log('Dispatched mouse click at coordinates', box.x, box.y);
    }

    // Also click directly via DOM click as double guarantee
    await cdp.eval(`(() => {
      const btn = document.getElementById('start-exam-btn');
      if (btn) btn.click();
    })()`);

    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      const inTest = await cdp.eval('Boolean(document.querySelector("textarea"))');
      console.log(`[After Click ${i + 1}s] hasTextarea:`, inTest);
      if (inTest) break;
    }

    const check = await cdp.eval(`(() => {
      const textarea = document.querySelector('textarea');
      const text = document.body ? document.body.innerText.slice(0, 100) : '';
      return { hasTextarea: Boolean(textarea), text };
    })()`);
    console.log('After CDP click:', check);

    // Take screenshot
    const res = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\brain\\ec2e52f9-f4ab-4f5d-815d-664331c3fae7\\test-after-click.png', Buffer.from(res.data, 'base64'));

  } finally {
    edgeProc.kill();
  }
}

run().catch(console.error);
