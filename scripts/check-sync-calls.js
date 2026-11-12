const fs = require('fs');

const r10 = fs.readFileSync('public/tests/reading-v5-t10.html', 'utf8');

// Find where novaSaveReadingProgress or novaSyncAttempt are defined and called
console.log('--- Searching for calls to novaSaveReadingProgress ---');
let pos = 0;
while ((pos = r10.indexOf('novaSaveReadingProgress', pos)) !== -1) {
  console.log('pos:', pos, r10.substring(pos - 60, pos + 100));
  pos += 'novaSaveReadingProgress'.length;
}

console.log('--- Searching for calls to novaSyncAttempt ---');
pos = 0;
while ((pos = r10.indexOf('novaSyncAttempt', pos)) !== -1) {
  console.log('pos:', pos, r10.substring(pos - 60, pos + 100));
  pos += 'novaSyncAttempt'.length;
}
