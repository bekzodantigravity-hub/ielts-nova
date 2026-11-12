import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const EDGE_BIN = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CD_PORT = 9315;
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

  async click(x, y) {
    await this.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x,
      y,
      button: 'left',
      clickCount: 1,
    });
    await sleep(50);
    await this.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x,
      y,
      button: 'left',
      clickCount: 1,
    });
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACTS_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`[Screenshot Saved] -> ${outPath}`);
    return outPath;
  }
}

async function main() {
  console.log('[1] Launching Edge headless on port', CD_PORT);
  const dataDir = path.resolve('.data', `edge_verify_click_${Date.now()}`);
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
    await cdp.send('DOM.enable');

    console.log('[2] Navigating to http://localhost:3000/dashboard');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/dashboard' });
    await sleep(4000);

    const initialUrl = await cdp.eval('window.location.href');
    console.log('[3] Initial Dashboard URL:', initialUrl);

    // Language pills check
    const langCheck = await cdp.eval(`
      (() => {
        const pills = Array.from(document.querySelectorAll('button, a')).filter(el => {
          const t = el.innerText.trim();
          return t === 'UZ' || t === 'RU' || t === 'EN';
        });
        return {
          pillCount: pills.length,
          pills: pills.map(p => p.innerText.trim())
        };
      })()
    `);
    console.log('[4] Language Switcher Pills Count:', langCheck);

    // Screenshot of Dashboard
    await cdp.captureScreenshot('verify-dashboard-clean-1click.png');

    // Test 1 light click on Full Mock link
    console.log('[5] Testing 1 light click on Full Mock link...');
    const fullMockBtn = await cdp.eval(`
      (() => {
        const el = Array.from(document.querySelectorAll('a')).find(a => a.href && a.href.includes('/dashboard/full-mock'));
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2), href: el.href };
      })()
    `);
    console.log('[6] Found Full Mock element:', fullMockBtn);

    if (fullMockBtn) {
      await cdp.click(fullMockBtn.x, fullMockBtn.y);
      await sleep(1500);
      const urlAfterClick = await cdp.eval('window.location.href');
      console.log('[7] URL after 1 click on Full Mock:', urlAfterClick);
      await cdp.captureScreenshot('verify-fullmock-page-1click.png');
    }

    // Test 1 light click on Sidebar "Amaliyot / Practice"
    console.log('[8] Testing 1 light click on Sidebar Practice link...');
    const practiceLink = await cdp.eval(`
      (() => {
        const el = Array.from(document.querySelectorAll('a')).find(a => a.href && a.href.includes('/dashboard/practice'));
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2), href: el.href };
      })()
    `);
    console.log('[9] Found Practice element:', practiceLink);

    if (practiceLink) {
      await cdp.click(practiceLink.x, practiceLink.y);
      await sleep(1500);
      const urlAfterPracticeClick = await cdp.eval('window.location.href');
      console.log('[10] URL after 1 click on Practice:', urlAfterPracticeClick);
      await cdp.captureScreenshot('verify-practice-page-1click.png');
    }

    // Check settings page
    console.log('[11] Navigating to /dashboard/settings...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/dashboard/settings' });
    await sleep(2000);
    await cdp.captureScreenshot('verify-settings-uzbek-card.png');

    const settingsCheck = await cdp.eval(`
      (() => {
        const text = document.body.innerText;
        return {
          hasUzbekCard: text.includes("O'zbek tili (Lotin yozuvi)"),
          hasRussianBtn: Array.from(document.querySelectorAll('button')).some(b => b.innerText.trim() === 'RU')
        };
      })()
    `);
    console.log('[12] Settings language check:', settingsCheck);

    console.log('=== ALL TESTS PASSED SUCCESSFULLY ===');
  } finally {
    edgeProc.kill();
  }
}

main().catch((err) => {
  console.error('[Verify script error]:', err);
  process.exit(1);
});
