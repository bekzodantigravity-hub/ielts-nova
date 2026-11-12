import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { signSessionToken } from '../lib/auth-token.ts';

const EDGE_BIN = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\ec2e52f9-f4ab-4f5d-815d-664331c3fae7';
const CD_PORT = 9281;

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

  async setViewport(width = 1280, height = 800) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(200);
  }

  async screenshot(filename, width = 1280, height = 800) {
    await this.setViewport(width, height);
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`[Screenshot saved] ${filename} (${width}x${height}, ${buffer.length} bytes)`);
  }

  async waitForText(textToFind, maxWaitMs = 15000) {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      try {
        const body = await this.eval('document.body ? document.body.innerText : ""');
        if (body && body.includes(textToFind)) {
          return true;
        }
      } catch (_) {}
      await sleep(400);
    }
    return false;
  }
}

async function run() {
  const tmpUserData = path.join(process.cwd(), '.data', 'edge_test_' + Date.now());
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

    const { token: jasurToken } = await signSessionToken({
      sub: 'usr_jasur_p7',
      email: 'jasur.karimov@gmail.com',
      name: 'Jasur Karimov',
      birthYear: 2005,
      age: 21,
      goal: "Chet elda ta'lim (Bakalavr / Magistratura — UK, AQSH, Yevropa)",
      targetBand: 8.0,
      dailyGoal: 40,
      examDate: '2026-11-28',
      provider: 'google',
    });

    // 1. First visit localhost:3000 to set cookies and localStorage
    await cdp.send('Page.navigate', { url: 'http://localhost:3000' });
    await sleep(1500);

    await cdp.eval(`
      document.cookie = "ielts_nova_session=${jasurToken}; path=/; max-age=604800";
      const u = {
        sub: 'usr_jasur_p7',
        email: 'jasur.karimov@gmail.com',
        name: 'Jasur Karimov',
        birthYear: 2005,
        age: 21,
        goal: "Chet elda ta'lim (Bakalavr / Magistratura — UK, AQSH, Yevropa)",
        targetBand: 8.0,
        dailyGoal: 40,
        examDate: '2026-11-28',
        provider: 'google'
      };
      const st = {
        theme: 'light',
        lang: 'uz',
        authUser: u,
        profile: {
          name: 'Jasur Karimov',
          birthYear: 2005,
          age: 21,
          goal: "Chet elda ta'lim (Bakalavr / Magistratura — UK, AQSH, Yevropa)",
          targetBand: 8.0,
          dailyGoal: 40,
          examDate: '2026-11-28'
        },
        inProgress: {},
        attempts: [],
        activity: {}
      };
      localStorage.setItem('ielts-nova:v2', JSON.stringify(st));
      localStorage.setItem('ielts-nova:account:jasur.karimov@gmail.com', JSON.stringify(st));
    `);

    // 2. Navigate to Dashboard
    console.log('Navigating to /dashboard...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/dashboard' });
    const hasDash = await cdp.waitForText('CDI Suite', 15000);
    console.log('Found CDI Suite in dashboard:', hasDash);
    await sleep(800);
    await cdp.screenshot('p7-05-dashboard-clean-home.png');

    // 3. Navigate to Full Mock
    console.log('Navigating to /dashboard/full-mock...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/dashboard/full-mock' });
    const hasFull = await cdp.waitForText('Full Mock', 15000);
    console.log('Found Full Mock:', hasFull);
    await sleep(800);
    await cdp.screenshot('p7-06-full-mock-hub.png');

  } finally {
    edgeProc.kill();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
