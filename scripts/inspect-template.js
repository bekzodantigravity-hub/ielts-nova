const fs = require('fs');

const r10 = fs.readFileSync('public/tests/reading-v5-t10.html', 'utf8');
const l09 = fs.readFileSync('public/tests/listening-v5-t09.html', 'utf8');

// 1. Style block
const r10Styles = [...r10.matchAll(/<style[\s\S]*?<\/style>/gi)];
console.log('r10 Style 1 length:', r10Styles[1][0].length);

// 2. Find landing card in r10 vs orig
const origR10 = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Reading, Volume 5, Test 10.html', 'utf8');

const r10LandingMod = r10.substring(r10.indexOf('<div class="card">'), r10.indexOf('<div class="card">') + 600);
const r10LandingOrig = origR10.substring(origR10.indexOf('<div class="card">'), origR10.indexOf('<div class="card">') + 600);

console.log('=== R10 Landing Mod ===\n', r10LandingMod);
console.log('=== R10 Landing Orig ===\n', r10LandingOrig);

// 3. Topbar in r10
const r10TopbarMod = r10.substring(r10.indexOf('<div class="topbar">'), r10.indexOf('<div class="topbar">') + 600);
console.log('=== R10 Topbar Mod ===\n', r10TopbarMod);

// 4. Injected Script
const r10Script = r10.substring(r10.indexOf('/* ============================================================\n   IELTS NOVA — PROGRESS SYNC'));
console.log('=== Injected script length in R10 ===', r10Script.length);

const l09Script = l09.substring(l09.indexOf('/* ============================================================\n   IELTS NOVA — PROGRESS SYNC'));
console.log('=== Injected script length in L09 ===', l09Script.length);
