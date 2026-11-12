import { spawn } from 'child_process';
import http from 'http';
import { signSessionToken } from '../lib/auth-token.ts';

const EDGE_BIN = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CD_PORT = 9296;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  const edgeProc = spawn(EDGE_BIN, [
    `--remote-debugging-port=${CD_PORT}`,
    '--headless=new',
    '--no-sandbox',
    '--window-size=1280,800',
    'about:blank',
  ]);
  try {
    await new Promise((r) => setTimeout(r, 1200));
    const targets = await fetchJson(`http://127.0.0.1:${CD_PORT}/json`);
    const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));
    let id = 1;
    function send(method, params = {}) {
      return new Promise((res) => {
        const reqId = id++;
        const handler = (msg) => {
          const parsed = JSON.parse(msg.data.toString());
          if (parsed.id === reqId) {
            ws.removeEventListener('message', handler);
            res(parsed.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    const { token } = await signSessionToken({
      sub: 'usr_test',
      email: 'jasur@test.com',
      name: 'Jasur Karimov',
      birthYear: 2005,
      age: 21,
      goal: 'Study',
      targetBand: 8.0,
      dailyGoal: 40,
      provider: 'google',
    });

    await send('Network.enable');
    await send('Network.setCookie', {
      name: 'ielts_nova_session',
      value: token,
      url: 'http://localhost:3000',
      domain: 'localhost',
      path: '/',
    });
    await send('Page.enable');
    await send('Page.navigate', { url: 'http://localhost:3000/dashboard' });

    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const res = await send('Runtime.evaluate', {
        expression: 'document.body ? document.body.innerText : ""',
        returnByValue: true,
      });
      if (res.result.value && res.result.value.includes('CDI Suite')) {
        console.log(`Page ready after ${i + 1}s`);
        break;
      }
    }

    const check = await send('Runtime.evaluate', {
      expression: `(() => {
        function info(el) {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const s = window.getComputedStyle(el);
          return {
            x: r.x, y: r.y, w: r.width, h: r.height,
            opacity: s.opacity,
            display: s.display,
            visibility: s.visibility,
            transform: s.transform,
            color: s.color,
            bg: s.backgroundColor
          };
        }
        return {
          h1: info(document.querySelector('h1')),
          main: info(document.querySelector('main')),
          aside: info(document.querySelector('aside')),
          header: info(document.querySelector('header')),
          scrollWidth: document.body.scrollWidth,
          scrollHeight: document.body.scrollHeight,
          bodySnippet: document.body.innerText.slice(0, 150)
        };
      })()`,
      returnByValue: true,
    });
    console.log('CHECK RESULT:', JSON.stringify(check.result.value, null, 2));

    // Also check what is at coordinate (500, 300)
    const elementAtPoint = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.elementFromPoint(500, 300);
        return el ? { tagName: el.tagName, className: el.className, text: el.innerText ? el.innerText.slice(0, 50) : '' } : null;
      })()`,
      returnByValue: true,
    });
    console.log('ELEMENT AT (500, 300):', JSON.stringify(elementAtPoint.result.value, null, 2));

    // Capture screenshot with captureBeyondViewport: false
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const buf = Buffer.from(shot.data, 'base64');
    console.log('SHOT BYTES:', buf.length);
    import('fs').then((fs) => {
      fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity\\brain\\ec2e52f9-f4ab-4f5d-815d-664331c3fae7\\diag-shot.png', buf);
    });

  } finally {
    edgeProc.kill();
  }
}
main().catch(console.error);
