import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const EDGE_BIN = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\ec2e52f9-f4ab-4f5d-815d-664331c3fae7';
const CD_PORT = 9320;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchJson(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
    });
  });
}

async function run() {
  console.log('=== Running Full Visual Capture for CD-IELTS Writing Module ===');

  const edgeProc = spawn(EDGE_BIN, [
    `--remote-debugging-port=${CD_PORT}`,
    '--headless=new',
    '--no-sandbox',
    '--disable-extensions',
    '--window-size=1280,850',
    'about:blank',
  ]);

  try {
    await sleep(1500);
    const targets = await fetchJson(`http://127.0.0.1:${CD_PORT}/json`);
    const pageTarget = targets.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension')) || targets[0];
    console.log('Connected to target:', pageTarget.url);

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
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

    await send('Runtime.enable');
    await send('Page.enable');

    // 1. Landing Page
    console.log('[1/4] Navigating to /writing (Landing)...');
    await send('Page.navigate', { url: 'http://localhost:3000/writing' });

    for (let i = 0; i < 20; i++) {
      await sleep(1000);
      const res = await send('Runtime.evaluate', {
        expression: 'Boolean(document.getElementById("start-exam-btn"))',
        returnByValue: true,
      });
      if (res.result?.value) {
        console.log(`Landing ready at ${i + 1}s`);
        break;
      }
    }

    await sleep(1000);
    const shotLanding = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'writing-01-landing.png'), Buffer.from(shotLanding.data, 'base64'));
    console.log('Saved writing-01-landing.png');

    // 2. Transition to Phase 2: Test UI (Task 1)
    console.log('[2/4] Switching to Test UI (Task 1)...');
    await send('Runtime.evaluate', {
      expression: 'window.__setWritingPhase("test")',
      returnByValue: true,
    });

    await sleep(2000);

    // Type Task 1 response into textarea
    await send('Runtime.evaluate', {
      expression: `(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
          textarea.value = 'The provided chart illustrates investments and overall generation capacity in various renewable energy sectors over a ten-year timeframe from 2012 to 2022. Overall, solar and wind energy experienced the most noticeable upward trajectories in both financial allocations and overall capacity. In contrast, traditional hydropower demonstrated steady but modest growth. In 2012, solar power investment commenced at roughly 45 billion dollars, while by 2022 this figure had risen substantially to over 130 billion dollars. Similarly, wind energy capacity grew from 50 gigawatts to 110 gigawatts by the end of the survey period.';
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()`,
      returnByValue: true,
    });

    await sleep(1200);
    const shotTest1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'writing-02-test-ui.png'), Buffer.from(shotTest1.data, 'base64'));
    console.log('Saved writing-02-test-ui.png');

    // 3. Switch to Task 2 (Discursive Essay)
    console.log('[3/4] Switching to Task 2...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('footer button')).find(b => b.textContent.includes('Task 2'));
        if (btn) btn.click();
      })()`,
      returnByValue: true,
    });

    await sleep(1000);

    // Type Task 2 response
    await send('Runtime.evaluate', {
      expression: `(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
          textarea.value = 'In contemporary society, the rapid emergence of artificial intelligence and machine automation across diverse sectors has sparked substantial controversy. While proponents maintain that technological implementation optimizes commercial productivity and enhances living standards, detractors contend that it exacerbates structural unemployment and widens income inequality. In my opinion, although automated systems undeniably generate short-term employment disruptions, technological innovation ultimately drives economic prosperity provided that proactive governmental policies support workforce reskilling. On the one hand, automation significantly reduces manufacturing margins and eradicates human error in high-precision domains, facilitating global economic efficiency. On the other hand, traditional manual laborers face abrupt displacement. To conclude, balanced integration paired with educational reforms ensures societal harmony.';
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()`,
      returnByValue: true,
    });

    await sleep(1200);
    const shotTask2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'writing-03-task2-active.png'), Buffer.from(shotTask2.data, 'base64'));
    console.log('Saved writing-03-task2-active.png');

    // 4. Submit & Results Dashboard
    console.log('[4/4] Submitting for Gemini AI evaluation...');
    // Click submit in footer
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('footer button')).find(b => b.textContent.includes('topshirish') || b.textContent.includes('Submit'));
        if (btn) btn.click();
      })()`,
      returnByValue: true,
    });

    await sleep(600);

    // Click confirm in modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Topshirish va Baholash'));
        if (btn) btn.click();
      })()`,
      returnByValue: true,
    });

    console.log('Submitted! Waiting for Gemini AI evaluation to complete...');
    for (let i = 0; i < 30; i++) {
      await sleep(1000);
      const res = await send('Runtime.evaluate', {
        expression: 'Boolean(document.body && document.body.innerText.includes("Overall Band"))',
        returnByValue: true,
      });
      if (res.result?.value) {
        console.log(`Results arrived after ${i + 1}s!`);
        break;
      }
    }

    await sleep(2000);
    const shotResults = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'writing-04-results-dashboard.png'), Buffer.from(shotResults.data, 'base64'));
    console.log('Saved writing-04-results-dashboard.png');

    console.log('✅ ALL 4 WRITING SCREENSHOTS SAVED SUCCESSFULLY!');

  } finally {
    edgeProc.kill();
  }
}

run().catch(console.error);
