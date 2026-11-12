const fs = require('fs');

const l09 = fs.readFileSync('public/tests/listening-v5-t09.html', 'utf8');

const p = l09.indexOf('novaSyncAttempt({');
console.log(l09.substring(p - 300, p + 500));
