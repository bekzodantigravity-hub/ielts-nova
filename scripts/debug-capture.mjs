import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import { signSessionToken } from '../lib/auth-token.ts';

const EDGE_BIN = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CD_PORT = 9298;

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

    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const res = await send('Runtime.evaluate', {
        expression: 'document.body ? document.body.innerText : ""',
        returnByValue: true,
      });
      console.log(`Poll ${i + 1} text length:`, res.result?.value?.length || 0);
      if (res.result?.value?.includes('CDI Suite')) {
        console.log(`FOUND CDI SUITE at poll ${i + 1}`);
        break;
      }
    }

    // Let animations complete
    await new Promise((r) => setTimeout(r, 2000));

    const htmlRes = await send('Runtime.evaluate', {
      expression: 'document.documentElement.outerHTML',
      returnByValue: true,
    });
    fs.writeFileSync('scripts/debug_page.html', htmlRes.result.value);
    console.log('Saved scripts/debug_page.html, size:', htmlRes.result.value.length);

    // Get screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(shot.data, 'base64');
    console.log('SHOT LENGTH:', buf.length);
    fs.writeFileSync('scripts/debug_shot.png', buf);
  } finally {
    edgeProc.kill();
  }
}
main().catch(console.error);
