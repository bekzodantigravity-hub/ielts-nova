const fs = require('fs');

const modL09 = fs.readFileSync('public/tests/listening-v5-t09.html', 'utf8');
const origL09 = fs.readFileSync('C:/Users/user/Downloads/AyuGram Desktop/Full Listening, Volume 5, Test 09 [safarov_english].html', 'utf8');

const bridgeComment = '/* ============================================================\n   IELTS NOVA — DASHBOARD SYNC';
const bridgeIdx = modL09.indexOf(bridgeComment);

// Find where origL09 code resumes
// Let's take 100 characters from origL09 after its first <script>
const origScriptIdx = origL09.indexOf('<script>');
console.log('origScriptIdx:', origScriptIdx);
const origFirstChars = origL09.substring(origScriptIdx + 8, origScriptIdx + 150);
console.log('origFirstChars in origL09:', JSON.stringify(origFirstChars));

const inModIdx = modL09.indexOf(origFirstChars.trim().substring(0, 50));
console.log('inModIdx:', inModIdx, 'distance from bridgeIdx:', inModIdx - bridgeIdx);

console.log('=== Injected bridge length in L09 ===', inModIdx - bridgeIdx);
console.log(modL09.substring(bridgeIdx, inModIdx));
