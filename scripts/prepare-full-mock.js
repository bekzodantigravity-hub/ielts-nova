const fs = require('fs');
const path = require('path');

const srcPath = 'C:/Users/user/Downloads/AyuGram Desktop/Full MockI - week 3 - @Xojaevs.html';
const destDir = path.join(__dirname, '..', 'public', 'mocks', 'full-mock');
const destPath = path.join(destDir, 'Full_Mock_Week_03_CDI.html');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

let content = fs.readFileSync(srcPath, 'utf8');

// 1. Title
content = content.replace(
  /<title>[^<]+<\/title>/i,
  '<title>IELTS Nova — Official Cambridge CDI Full Mock (80 Questions)</title>'
);

// 2. Color Replacements for Emerald Brand
content = content.replace(/--logo:#e2231a;/g, '--logo:#059669;');
content = content.replace(/--accent:#d6001c;/g, '--accent:#059669;');
content = content.replace(/--tick:#3b5bdb;/g, '--tick:#059669;');
content = content.replace(/--field-focus:#1e6cd8;/g, '--field-focus:#059669;');
content = content.replace(/--hl-bg:#a52c5c;/g, '--hl-bg:#10b981;');
content = content.replace(/--flag-on:#d6001c;/g, '--flag-on:#059669;');
content = content.replace(/--answered:#2ba84a;/g, '--answered:#059669;');
content = content.replace(/--ok:#1a8a3c;/g, '--ok:#059669;');

// Dark mode overrides
content = content.replace(/--logo:#ff5c66;/g, '--logo:#10b981;');
content = content.replace(/--accent:#ff5c66;/g, '--accent:#10b981;');
content = content.replace(/--tick:#6ea8ff;/g, '--tick:#10b981;');
content = content.replace(/--field-focus:#6ea8ff;/g, '--field-focus:#10b981;');
content = content.replace(/--hl-bg:#ff7ab0;/g, '--hl-bg:#059669;');
content = content.replace(/--flag-on:#ff5c66;/g, '--flag-on:#10b981;');
content = content.replace(/--answered:#4ed684;/g, '--answered:#10b981;');

// 3. Topbar Brand Replacement
const oldLogo = '<div class="logo" id="logo">IELTS<sup>™</sup></div>';
const newLogo = `<div class="logo" id="logo" style="display:flex;align-items:center;gap:8px;cursor:pointer;" onclick="if(window.parent&&window.parent!==window){window.parent.location.href='/dashboard';}else{window.location.href='/dashboard';}">
      <img src="/logo-mark.png" style="height:24px;width:24px;object-fit:contain;" alt="IELTS Nova"/>
      <span style="font-weight:900;letter-spacing:-0.5px;color:var(--text);">IELTS <span style="color:#059669;">Nova</span></span>
      <span style="background:rgba(5,150,105,0.15);color:#059669;font-size:10px;font-weight:800;padding:2px 7px;border-radius:6px;margin-left:4px;letter-spacing:0.5px;">CDI FULL MOCK</span>
    </div>`;

content = content.replace(oldLogo, newLogo);

// 4. Exit / Back to Dashboard button in top-right
const oldTopRight = '<div class="top-right">';
const newTopRight = `<div class="top-right">
    <button type="button" id="exitMockBtn" onclick="if(confirm('Imtihondan chiqib shaxsiy kabinetga qaytishni xohlaysizmi?')){if(window.parent&&window.parent!==window){window.parent.location.href='/dashboard';}else{window.location.href='/dashboard';}}" style="background:transparent;border:1px solid var(--border);color:var(--text);border-radius:8px;padding:6px 12px;margin-right:8px;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
      <span>&larr;</span><span>Kabinetga qaytish</span>
    </button>`;

content = content.replace(oldTopRight, newTopRight);

// 5. Upgrade showResults to postMessage and add navigation buttons
const showResultsPattern = /function showResults\(\)\{[\s\S]*?openModal\(`<h2>Your Results<\/h2>[\s\S]*?<\/div>`\);[\s\S]*?CONFETTI\.fire\(\);[\s\S]*?\}/;

const upgradedShowResults = `function showResults(){
  const haveL=Object.keys(L_KEY).length>0;
  const L=haveL?gradeSection('L',L_KEY):rawSection('L'), R=gradeSection('R',R_KEY);
  const bandLVal = haveL ? bandL(L.score) : 6.0;
  const bandRVal = bandR(R.score);
  const overallBand = Math.round(((bandLVal + bandRVal) / 2) * 2) / 2;

  // Sync with IELTS Nova parent app
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'IELTS_NOVA_FULL_MOCK_SUBMIT',
        payload: {
          testId: 'full-mock-1',
          listeningScore: L.score,
          listeningBand: bandLVal,
          readingScore: R.score,
          readingBand: bandRVal,
          overallBand: overallBand,
          timeSpentSec: (60 * 60) - (TIMER ? TIMER.remainingSec || 0 : 0),
          submittedAt: new Date().toISOString(),
          answers: typeof answers !== 'undefined' ? answers : {}
        }
      }, '*');
    }
  } catch (e) {
    console.error('Error sending postMessage to IELTS Nova:', e);
  }

  openModal(\`<h2>IELTS Nova — To'liq Imtihon Natijalari</h2>
    <div style="text-align:center;margin:8px 0 16px;">
      <span style="display:inline-block;background:rgba(5,150,105,0.15);border:1px solid rgba(5,150,105,0.3);color:#059669;font-weight:900;font-size:18px;padding:8px 20px;border-radius:12px;">
        OVERALL BAND: \${overallBand.toFixed(1)}
      </span>
    </div>
    <div class="bandrow">
      <div class="bandcard" style="border-top:3px solid #059669;">
        <div class="bl">Listening (40 savol)</div>
        <div class="bv" style="color:#059669;">\${haveL?bandLVal.toFixed(1):"&mdash;"}</div>
        <div class="bs">\${haveL?(L.score+" / 40 to'g'ri"):"kalit topilmadi"}</div>
      </div>
      <div class="bandcard" style="border-top:3px solid #059669;">
        <div class="bl">Academic Reading (40 savol)</div>
        <div class="bv" style="color:#059669;">\${bandRVal.toFixed(1)}</div>
        <div class="bs">\${R.score} / 40 to'g'ri</div>
      </div>
    </div>
    <div style="margin:20px 0 12px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
      <button type="button" onclick="if(window.parent&&window.parent!==window){window.parent.location.href='/dashboard/results';}else{window.location.href='/dashboard/results';}" style="background:#059669;color:#fff;border:none;padding:10px 18px;border-radius:10px;font-weight:bold;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
        <span>💡 Xatolar Tahlili va Tushuntirishlar &rarr;</span>
      </button>
      <button type="button" onclick="if(window.parent&&window.parent!==window){window.parent.location.href='/dashboard';}else{window.location.href='/dashboard';}" style="background:var(--border);color:var(--text);border:none;padding:10px 18px;border-radius:10px;font-weight:bold;cursor:pointer;">
        <span>Bosh sahifaga qaytish</span>
      </button>
    </div>
    <details class="resd"><summary>Listening — Javoblaringiz tahlili (\${L.score} / 40)</summary>
      <table class="res-table"><thead><tr><th>Q</th><th>Sizning javobingiz</th><th>To'g'ri javob</th><th>Natija</th></tr></thead><tbody>\${L.rows}</tbody></table>
    </details>
    <details class="resd"><summary>Academic Reading — Javoblaringiz tahlili (\${R.score} / 40)</summary>
      <table class="res-table"><thead><tr><th>Q</th><th>Sizning javobingiz</th><th>To'g'ri javob</th><th>Natija</th></tr></thead><tbody>\${R.rows}</tbody></table>
    </details>
    <div class="m-actions"><button id="mBack" class="primary">Yopish</button></div>\`);
  CONFETTI.fire();
  $('mBack').addEventListener('click',()=>{ closeModal(); CONFETTI.stop(); });
}`;

content = content.replace(showResultsPattern, upgradedShowResults);

fs.writeFileSync(destPath, content, 'utf8');
console.log('Saved branded Full Mock to:', destPath);
console.log('Output size:', fs.statSync(destPath).size);
