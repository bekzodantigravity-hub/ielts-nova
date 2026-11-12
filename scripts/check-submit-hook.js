const fs = require('fs');

const r10 = fs.readFileSync('public/tests/reading-v5-t10.html', 'utf8');

const p = r10.indexOf('novaSyncAttempt({');
console.log(r10.substring(p - 300, p + 500));
