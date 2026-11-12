const fs = require('fs');

const origL09 = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Listening, Volume 5, Test 09 [safarov_english].html', 'utf8');
const modL09 = fs.readFileSync('public/tests/listening-v5-t09.html', 'utf8');

// Let's check where the bridge was inserted in listening
const bridgeComment = '/* ============================================================\n   IELTS NOVA — DASHBOARD SYNC';
const bridgeIdx = modL09.indexOf(bridgeComment);
console.log('Bridge found in modL09 at:', bridgeIdx);

// Let's check what comes immediately after the bridge in modL09
const afterBridge = modL09.substring(bridgeIdx, bridgeIdx + 4500);
console.log('--- Bridge start ---\n', afterBridge.substring(0, 500));
console.log('--- Bridge end ---\n', afterBridge.substring(afterBridge.length - 500));
