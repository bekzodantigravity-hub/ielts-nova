const fs = require('fs');

const modL09 = fs.readFileSync('public/tests/listening-v5-t09.html', 'utf8');

const afterBridge = modL09.substring(65734);

// Find where novaSyncAttempt or novaSyncProgress are called
let p = 0;
while ((p = afterBridge.indexOf('novaSyncAttempt', p)) !== -1) {
  console.log('novaSyncAttempt at rel:', p);
  console.log(afterBridge.substring(p - 80, p + 120));
  p += 'novaSyncAttempt'.length;
}

p = 0;
while ((p = afterBridge.indexOf('novaSyncProgress', p)) !== -1) {
  console.log('novaSyncProgress at rel:', p);
  console.log(afterBridge.substring(p - 80, p + 120));
  p += 'novaSyncProgress'.length;
}
