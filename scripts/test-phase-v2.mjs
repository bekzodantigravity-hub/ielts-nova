import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const EDGE_BIN = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\ec2e52f9-f4ab-4f5d-815d-664331c3fae7';
const CD_PORT = 9326;

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

const T1_ESSAY = `The provided bar chart delineates the employment figures across four tourism-related sectors in a specific UK city over a two-decade period spanning from 1989 to 2009.

Overall, it is immediately apparent that the restaurant industry was the predominant employer throughout the surveyed timeframe, exhibiting an unmistakable upward trajectory before experiencing a moderate contraction. In stark contrast, travel and tour positions suffered the steepest contraction, with job numbers halving by 2009.

Looking first at the dining and hospitality sectors, restaurant employment initiated at 1,100 positions in 1989 and climbed steadily to reach an unprecedented pinnacle of 1,600 jobs in 2004, prior to receding to 1,300 in 2009. Similarly, the hotel industry witnessed considerable growth in the initial five years, peaking at 1,400 in 1994, although it subsequently hovered near 1,050 for the remainder of the period.

Regarding the remaining fields, sport and leisure oscillated between a nadir of 700 and a high of 1,050. Finally, travel and tour started at 800, surged to 1,040 in 1994, and subsequently underwent a precipitous drop to a mere 400 jobs.`;

const T2_ESSAY = `In contemporary socio-economic discourse, the pervasive ascendancy of cognitive automation and artificial intelligence across various industries has incited intense debate. While prominent technocrats maintain that algorithmic deployment optimizes production efficiency and stimulates macro-economic prosperity, detractors assert that it induces systemic structural unemployment and exacerbates socio-economic disparities. In my perspective, although artificial intelligence undoubtedly sparks transitory labor disruptions, proactive state-orchestrated reskilling initiatives can harness technological advancement to foster sustainable collective prosperity.

On the one hand, integrating automated systems drastically diminishes marginal operational costs, eliminates human errors in precision sectors, and accelerates scientific innovation. For example, robotic process automation in logistics and algorithmic diagnostics in healthcare consistently surpass manual benchmarks.

On the other hand, the rapid obsolescence of routine manual occupations exposes vulnerable demographics to acute dislocation without adequate social safety nets.

To conclude, strategic workforce adaptation paired with institutional educational reforms ensures that technological automation amplifies human capacity rather than diminishing societal welfare.`;

async function run() {
  console.log('=== Running Full Live Evaluation & Screenshots Capture ===');

  const edgeProc = spawn(EDGE_BIN, [
    `--remote-debugging-port=${CD_PORT}`,
    '--headless=new',
    '--no-sandbox',
    '--disable-extensions',
    '--window-size=1280,950',
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

    // 1. Landing
    console.log('[1/5] Navigating to /writing (Landing)...');
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
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'writing-v2-01-landing.png'), Buffer.from(shotLanding.data, 'base64'));

    // 2. Switch to Test UI and populate essays
    console.log('[2/5] Setting Test UI & Essays...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        window.__setWritingPhase("test");
        window.__setEssays(${JSON.stringify(T1_ESSAY)}, ${JSON.stringify(T2_ESSAY)});
      })()`,
      returnByValue: true,
    });
    await sleep(2000);

    const shotTestUI = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'writing-v2-02-test-ui.png'), Buffer.from(shotTestUI.data, 'base64'));
    console.log('Saved writing-v2-02-test-ui.png with populated Task 1 & HD Table');

    // 3. Submit for Evaluation
    console.log('[3/5] Submitting for Gemini AI calibrated evaluation...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('footer button')).find(b => b.textContent.includes('topshirish') || b.textContent.includes('Submit'));
        if (btn) btn.click();
      })()`,
      returnByValue: true,
    });
    await sleep(600);

    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Topshirish va Baholash'));
        if (btn) btn.click();
      })()`,
      returnByValue: true,
    });

    console.log('Waiting for AI evaluation results (overall band)...');
    for (let i = 0; i < 40; i++) {
      await sleep(1000);
      const res = await send('Runtime.evaluate', {
        expression: 'Boolean(document.body && document.body.innerText.includes("OVERALL BAND"))',
        returnByValue: true,
      });
      if (res.result?.value) {
        console.log(`Results arrived at ${i + 1}s!`);
        break;
      }
    }

    await sleep(2500);
    const shotResults = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'writing-v2-03-results.png'), Buffer.from(shotResults.data, 'base64'));
    console.log('Saved writing-v2-03-results.png');

    // 4. Test AI Mashqlar Tab
    console.log('[4/5] Testing AI Mashqlar Tab...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('AI Mashqlar'));
        if (btn) btn.click();
      })()`,
      returnByValue: true,
    });
    await sleep(1500);

    const shotExercises = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'writing-v2-04-exercises.png'), Buffer.from(shotExercises.data, 'base64'));
    console.log('Saved writing-v2-04-exercises.png');

    // 5. Test AI Ustoz Live Chat Tab
    console.log('[5/5] Testing AI Ustoz Live Chat Tab...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('AI Ustoz'));
        if (btn) btn.click();
      })()`,
      returnByValue: true,
    });
    await sleep(1500);

    const shotChat = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'writing-v2-05-live-chat.png'), Buffer.from(shotChat.data, 'base64'));
    console.log('Saved writing-v2-05-live-chat.png');

    console.log('🎉 ALL 5 HIGH-DEFINITION SCREENSHOTS RECORDED!');
  } finally {
    edgeProc.kill();
  }
}

run().catch(console.error);
