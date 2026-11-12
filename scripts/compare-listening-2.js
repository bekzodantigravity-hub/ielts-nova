const fs = require('fs');

const modL09 = fs.readFileSync('public/tests/listening-v5-t09.html', 'utf8');

const idxStyle = modL09.indexOf('IELTS NOVA — EXECUTIVE');
console.log('IELTS NOVA — EXECUTIVE in modL09 at:', idxStyle);
if (idxStyle !== -1) {
  console.log(modL09.substring(idxStyle - 50, idxStyle + 200));
}

const idxBridge = modL09.indexOf('IELTS NOVA — DASHBOARD SYNC');
console.log('IELTS NOVA — DASHBOARD SYNC in modL09 at:', idxBridge);
if (idxBridge !== -1) {
  console.log(modL09.substring(idxBridge - 50, idxBridge + 200));
}
