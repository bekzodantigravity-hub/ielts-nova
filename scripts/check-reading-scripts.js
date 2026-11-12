const fs = require('fs');

const mod = fs.readFileSync('public/tests/reading-v5-t10.html', 'utf8');

const sIdx1 = mod.indexOf('<script src=');
const sIdx2 = mod.indexOf('<script>');
console.log('sIdx1:', sIdx1, 'sIdx2:', sIdx2);
console.log(mod.substring(sIdx1 - 100, sIdx1 + 200));
